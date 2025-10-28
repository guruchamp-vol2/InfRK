# Massive Crafting Kit — 1B+ Virtual Items

This kit gives you a *procedurally generated* crafting system with a **virtual** space of over a billion items and components — no huge downloads, no database, no API keys.

## How it works
- Every numeric ID maps deterministically to 2–4 types using a fast PRNG (Mulberry32).
- Items: `Item-<ID>`, Components: `Comp-<ID>`.
- Weakness rules decide if your crafted item beats the target (if any crafted type is a weakness of the target).

## Features
- 🎮 Progressive challenges (Beat Rock, Master Elements, Legendary Crafter)
- 💾 Save favorites and track crafting history
- 📊 Type rarity system and probability insights
- 🌙 Dark mode support
- 📱 Mobile-friendly responsive design
- 🏆 Achievement tracking

## Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment
This game can be deployed to Render.com:

1. Fork this repository
2. Create a new Web Service on Render
3. Choose "Static Site" as the environment
4. Connect your GitHub repository
5. Use these settings:
   - Build Command: `echo "No build needed - static files"`
   - Publish Directory: `./`

The game will be available at `https://your-service-name.onrender.com`

## Files
- `index.html` — the full app (UI + logic)
- `worker.js` — Web Worker for component scanning
- `server.js` — Development server
- `render.yaml` — Render deployment config

## Tips & Tricks
- Press **R** to refresh the component page (new random sample)
- Use **Combos Scanner** to search huge ranges quickly
- Save powerful combinations as favorites
- Check Type Insights for rare components
- Everything is local and free. **No API key** required