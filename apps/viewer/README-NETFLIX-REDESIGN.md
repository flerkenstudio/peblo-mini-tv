# Peblo Mini TV Viewer — Netflix-style redesign

This folder contains the **viewer only**. The backend/API and CMS are intentionally not included.

## What changed
- Cinematic Netflix-style dark layout.
- Sticky navbar with search and profile treatment.
- Large catalogue-driven hero banner.
- Horizontal content rails with desktop navigation arrows.
- Poster cards with hover/focus actions and metadata overlays.
- Responsive search and filter experience.
- Cinematic show detail page with season/language controls.
- Episode list with thumbnail support.
- Loading, empty and error states.
- Lightweight SVG icons; no new runtime dependency was added.

## Existing API contract kept
- `GET /api/catalog`
- `GET /api/catalog/search?q=&category=&language=&section=`

The viewer continues to read the published catalogue through the existing API. No admin endpoint is introduced.

## Validation
TypeScript source check passes with:

```bash
npm exec -- tsc --noEmit --pretty false
```

A full Vite production build requires the platform-specific optional Rollup package to be installed in `node_modules`; the uploaded dependency folder did not contain that package in the sandbox environment. No application-source TypeScript errors remain.
