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
## Development and new controls

Run `npm ci`, `npm test`, then `npm start` (Node 22 or newer required). Tests cover deterministic generation, progress recovery, worker validation and large IDs. The server only serves the game assets and `/health`.

Daily Challenge picks a deterministic target for the UTC date. Progress export/import preserves history, favorites and challenge counters; malformed data is rejected or normalized. History restores a recipe without replaying a craft or increasing challenge progress. Element challenges require wins against all four elements.

IDs from 0 through 999999999999 are supported. IDs below 2^32 preserve their previous type mapping; higher bits are mixed into the generator, so large IDs no longer silently wrap. Finite type combinations can still repeat across different IDs. Scans are bounded to one million checks, one thousand results and two thousand pool samples. Stop cancels both scan workers.

## Workshop overhaul

The responsive workshop now includes a ten-stage expedition, XP levels, a 34-type discovery collection, eight achievements, a named recipe library, a daily reward, and suggestions for counters on the current component page. Expedition stages enforce their component budget; the last two require counters to every target type. Stages unlock in order.

Each new target/recipe combination grants research XP once; repeated attempts still count toward your craft record. Daily bonuses are limited to one per UTC date and recipes of three components or fewer. All progression, discoveries, recipes, favorites, and history are included in progress exports. Recipe import normalizes IDs and bounded counters; high IDs remain intact. These are local single-player records, editable through backups.

`npm test` runs 10 regression tests, including reward deduplication, expedition conditions, daily limits, recipe naming and timestamps, progress normalization, and worker/large-ID behavior. Browser validation covers quest selection, crafting suggestions, recipe persistence, the research scanner, safe imports, and mobile layout. Theme choice persists across reloads.
