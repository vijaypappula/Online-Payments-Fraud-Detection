<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (see [.env.example](.env.example))
3. Run the app:
   `npm run dev`

## Deploy

### Vercel
1. Push this repo to GitHub.
2. In Vercel, import the repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `VITE_GEMINI_API_KEY` = your Gemini API key
5. Deploy.

`vercel.json` is included for SPA route fallback.

### Netlify
1. Connect this repo in Netlify.
2. Build settings are auto-read from `netlify.toml`:
   - Base dir: `frontend`
   - Build command: `npm run build`
   - Publish dir: `dist`
3. Add environment variable:
   - `VITE_GEMINI_API_KEY` = your Gemini API key
4. Deploy.
