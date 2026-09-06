import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.database import init_db
from app.api import auth, shows, seasons, episodes, artwork, catalog, validation, health

init_db()

app = FastAPI(title="Peblo Mini TV API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.STORAGE_ROOT, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_ROOT), name="storage")

for router in (
    auth.router,
    shows.router,
    seasons.router,
    episodes.router,
    artwork.router,
    catalog.router,
    validation.router,
    health.router,
):
    app.include_router(router)
