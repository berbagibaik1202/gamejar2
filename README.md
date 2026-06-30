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
