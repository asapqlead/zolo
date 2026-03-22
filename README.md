# ZOLO — do the thing. get the points.

A Gen Z-native gamified productivity PWA — Next.js 15, Zustand, no backend needed.

## Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel && vercel --prod
```

### Option B — GitHub import
1. Push this folder to GitHub
2. vercel.com → New Project → import repo → Deploy
3. No env vars needed — AI reflection has a built-in fallback

## Run locally
```bash
npm install && npm run dev
```

## Stack
- Next.js 15 App Router
- Zustand (localStorage persistence, no backend)
- Syne + DM Sans fonts
- Lucide icons, canvas-confetti
- Anthropic Claude API for AI reflections (optional — falls back gracefully)
