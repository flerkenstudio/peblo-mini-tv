# Peblo Mini TV

A mini streaming platform: a FastAPI + PostgreSQL backend, a React CMS for
editors/admins, and a React viewer that only ever reads a published,
immutable catalogue JSON (never the live database).

## Stack

- **API**: FastAPI, SQLAlchemy 2.0, PostgreSQL (SQLite for tests), JWT auth
- **CMS**: React + TypeScript + Vite (port 5173)
- **Viewer**: React + TypeScript + Vite (port 5174)

## Quick start — local (no Docker)

```bash
# 1. Database (Docker for Postgres only; everything else runs natively)
docker compose up -d db          # creds: peblo / peblo

# 2. API
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000/docs

# 3. Seed users + sample data (new terminal, from repo root)
python scripts/seed.py
#   -> admin@peblo.tv / admin123
#   -> editor@peblo.tv / editor123

# 4. CMS (new terminal)
cd apps/cms
npm install
npm run dev                      # http://localhost:5173

# 5. Viewer (new terminal)
cd apps/viewer
npm install
npm run dev                      # http://localhost:5174
```

> No Postgres handy? Point `DATABASE_URL` in `.env` at SQLite instead, e.g.
> `DATABASE_URL=sqlite:///./peblo.db`, and skip step 1.

## Quick start — Docker (everything)

```bash
docker compose up --build
# API:    http://localhost:8000/docs
# CMS:    http://localhost:5173
# Viewer: http://localhost:5174
```

The `cms` and `viewer` containers build production (nginx-served) bundles
that proxy `/api` and `/storage` to the `api` container.

## Roles

- **editor** — manage shows, seasons, episodes, artwork
- **admin** — everything an editor can do, plus publishing

## Publish flow

1. Validation report must be clean (no blocking problems)
2. Catalogue JSON is built: language variants merged, season 0 (trailers)
   excluded, deterministic ordering, featured hero picked
3. A checksum "version" is computed from the catalogue's content (excluding
   the timestamp), so publishing unchanged data twice yields the same
   version — publishing is idempotent
4. The file is written atomically (`os.replace`), so the viewer can never
   see a half-written catalogue
5. Every run (success or failure) is recorded in publish history

## Golden path (5 minutes)

1. Log into the CMS as **admin** → create a show → add **Season 1** → add
   an episode with a duration → set the episode's and show's status to
   **published** → set a **Section**.
2. **Artwork** tab → upload a 600×900 poster, a 1280×720 banner, and a
   640×360 thumbnail (`≤200 KB`, JPEG/PNG). You can generate quick test
   images with:
   ```bash
   python -c "from PIL import Image; Image.new('RGB',(600,900),(200,50,50)).save('poster.jpg', quality=85)"
   ```
3. **Publish** page → button becomes enabled once validation is clean →
   click **Publish Catalogue** → note the version hash.
4. Open the Viewer at `:5174` → hero banner + your show with its poster →
   click through to the episode list → toggle language.
5. Publish again → same version hash (idempotent). Try publishing while
   logged in as **editor** → blocked with "Admin role required."

## Tests

```bash
cd apps/api
pip install -r requirements.txt
pytest -v
```

16 tests cover: login/permissions, editor-vs-admin enforcement, artwork
ratio/size/type validation, the validation engine's blockers, publish
determinism/idempotency, and season-0 exclusion + language merging.

## Project layout

```
peblo-mini-tv/
├── apps/api/            FastAPI backend
│   ├── app/
│   │   ├── api/         routers (auth, shows, seasons, episodes, artwork, catalog, validation, health)
│   │   ├── core/        config, security, auth dependencies
│   │   ├── db/          SQLAlchemy engine + models
│   │   ├── schemas/     Pydantic request/response models
│   │   ├── services/    validation engine, catalogue builder, publisher
│   │   └── storage/     storage backend abstraction (local disk)
│   └── tests/           pytest suite
├── apps/cms/            React admin/editor app
├── apps/viewer/         React public viewer app
├── data/seed/           sample seed data (with an intentionally imperfect entry)
├── scripts/seed.py      creates the two demo users + imports seed data
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Design Decisions & Trade-offs (Part E)

### Atomic publishing — and what happens if the process dies

Publishing never overwrites the live catalogue in-place. Instead, the
publisher writes to a temporary file (`tempfile.mkstemp` in the same
directory), calls `flush()` + `os.fsync()` to guarantee bytes are on disk,
then performs `os.replace(tmp, catalogue.json)`. On POSIX systems
`os.replace` is an atomic rename — the viewer either sees the old file or
the new one, never a partial write.

If the process dies at any point before `os.replace`, the temp file is
orphaned and the previous catalogue stays intact. The database records the
publish run with `status="failed"` and `completed_at=None`, so the CMS
publish-history view surfaces the failure. The next successful publish
cleans the state.

### Storage abstraction — moving to Cloudflare R2

All file operations flow through a `StorageBackend` abstract base class
(`app/storage/base.py`) with six methods: `upload`, `delete`, `exists`,
`get_url`, `write_catalogue`, and `read_catalogue`. The `get_storage()`
factory in `app/storage/__init__.py` reads `STORAGE_BACKEND` from config
and returns the matching implementation.

To move to Cloudflare R2 (which is S3-compatible): implement an
`R2Storage(StorageBackend)` class using `boto3` (about 80–100 lines), add
`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET`
to settings, and set `STORAGE_BACKEND=r2` in `.env`. The `get_url()` method
would return a CDN URL instead of `/storage/...`, and `write_catalogue`
would use `PutObject`. Everything else — routers, publisher, validation —
stays untouched.

### Search implementation, scale limits, and next steps

The viewer's search endpoint (`GET /catalog/search`) loads the published
`catalogue.json` into memory and filters shows by title, synopsis, episode
titles, category, language, and section — all in Python. The admin's show
list uses a SQL `ILIKE` query against the database.

This works well for the current catalogue size (single-digit to low
hundreds of shows). At roughly 5,000–10,000 shows the in-memory JSON
approach breaks down: memory usage grows linearly, and Python iteration
becomes noticeably slow (hundreds of milliseconds per request).

**Next steps:** Move to PostgreSQL full-text search (`tsvector` column +
GIN index on title/synopsis) for sub-millisecond queries regardless of
catalogue size. For faceted search with typo tolerance, add a lightweight
search engine like Meilisearch as a sidecar.

### Why serve a pre-published catalogue file instead of querying the DB?

The viewer is fully decoupled from the database. Benefits: the catalogue
JSON can be CDN-cached (sub-millisecond global reads), the viewer imposes
zero load on the database, and the published snapshot is an immutable
contract — editors can keep drafting without affecting what viewers see.

Where it bites: viewer content is stale until someone clicks Publish (a
minutes-long delay). The catalogue search is limited to what's serialised
in the JSON (no joins, no ad-hoc queries). The file grows linearly with
the number of shows — at scale, you'd want to split into per-section or
paginated fragments.

### What I left out and why

- **Alembic migrations**: Used `create_all()` for development speed.
  Production would need Alembic for schema versioning.
- **Episode-level artwork in the CMS UI**: The backend supports it, but the
  CMS only exposes show-level artwork upload. Kept scope manageable.
- **Pagination on catalogue search**: The in-memory search returns all
  results at once. Fine for hundreds of shows; would need cursor/offset
  pagination at scale.
- **Rate limiting / abuse prevention**: Not implemented; would add via
  FastAPI middleware or an API gateway in production.
- **Versioned catalogue with rollback**: Stretch goal. Would store each
  published version (e.g. `catalogue-{version}.json`) and add an admin
  endpoint to revert.
- **WebSocket live-publish notifications**: The viewer currently has to
  refresh to pick up a new publish; a WebSocket push would close that gap.

### AI tools

Claude and GitHub Copilot were used for boilerplate scaffolding (Docker
files, CI YAML, Pydantic schemas). Output was accepted for repetitive
patterns (CRUD endpoint stubs, CSS resets) and rejected when it suggested
oversimplified approaches — e.g., Copilot initially suggested overwriting
the catalogue file directly (no atomic rename), which was replaced with
the temp-file + `os.replace` approach. All architectural decisions
(storage abstraction design, publish idempotency via content hashing,
validation-before-publish gate) were made manually.

## Secrets management

The `.env.example` file documents every variable. In production, **never
commit a `.env` file** to version control. Instead:

- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or
  Cloudflare Workers Secrets) to store `JWT_SECRET`, `DATABASE_URL`, and
  any R2/S3 credentials.
- Inject secrets as environment variables via your CI/CD pipeline (GitHub
  Actions secrets → `${{ secrets.JWT_SECRET }}`), your container
  orchestrator (ECS task definition secrets, Kubernetes Secrets), or a
  `.env` file generated at deploy time from the secrets store.
- Rotate `JWT_SECRET` periodically; existing tokens will be invalidated,
  which is acceptable for a short-lived access token (60 min expiry).

## Health & alerting

The `/health` endpoint checks both database connectivity (`SELECT 1`) and
storage availability (`exists("_probe")`), returning `"ok"` or
`"degraded"` with per-subsystem detail.

**One thing I'd alert on: consecutive failed publish runs.** If
`publish_runs` accumulates rows with `status='failed'`, editors are making
changes that never reach viewers. A monitor that queries
`SELECT COUNT(*) FROM publish_runs WHERE status='failed' AND started_at > now() - interval '1 hour'`
and fires an alert when the count exceeds 2 would catch both
infrastructure issues (storage unavailable, DB connection pool exhausted)
and data-quality regressions (validation blockers nobody is fixing).

## Time spent

| Area | Approx. time |
|------|------|
| Data model + API routes | ~3 h |
| Publish pipeline (validation, builder, atomic writer) | ~2 h |
| CMS UI | ~3 h |
| Viewer UI | ~3 h |
| Tests | ~1.5 h |
| Docker, CI, docs | ~1.5 h |
| **Total** | **~14 h** |

## Notes / known limitations

- Artwork that fails validation is rejected outright rather than
  auto-cropped/re-encoded — this was a deliberate simplicity trade-off.
- The catalogue file is the only thing the Viewer ever reads — if you
  don't see your changes there, check that you actually clicked Publish.
- No Alembic migrations yet — schema changes require `drop_all` +
  `create_all` (see "What I left out" above).
