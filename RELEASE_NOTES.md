# Release Notes

## v1.0.0 - 2026-06-30

### Summary
This release delivers the initial production-ready version of the Gamejar app with Docker deployment support.

### Highlights
- Added Docker support via `Dockerfile` and `docker-compose.yml`
- Configured production build target and runtime container
- Set host port mapping to `3003`
- Added `restart: unless-stopped` policy for Docker container
- Updated `README.md` with local development and Docker deployment instructions
- Removed AI Studio references and banner from README
- Created `CHANGELOG.md` for release tracking

### Notes
- The app runs on `http://localhost:3003` when using Docker Compose
- Use `docker compose up -d --build` to start the container in detached mode
- Tag `v1.0.0` was created and pushed to GitHub
