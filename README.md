# Run and deploy your Gamejar app

This repository contains everything you need to run the app locally and in Docker.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

1. Make sure Docker is installed and the `proxy-net` network exists:
   `docker network create proxy-net`
2. Build and start the production container:
   `docker compose up --build`
3. Open the app at `http://localhost:3003`

## Deployment

For production deployment, run the container in detached mode so it stays running after you close the terminal:

```bash
docker compose up -d --build
```

The service is configured with `restart: unless-stopped`, so Docker will automatically restart the container after a host reboot.
