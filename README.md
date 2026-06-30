<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b8e13d06-6633-4f53-82df-b9f0b82aa235

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
