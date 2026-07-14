# Signal — TikTok intelligence

Signal scans TikTok trends by country and surfaces the videos, sounds, hooks,
hashtags and creators worth acting on today. This is the production rebuild of
the original vanilla HTML/CSS/JS prototype, on a modern, secure stack.

## Stack

- **Next.js 16** (App Router, Turbopack) — Server Components by default
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** layered over the hand-written Signal design system
- **next/font** — self-hosted Bricolage Grotesque, Inter, JetBrains Mono
- Zero runtime dependencies beyond React/Next: icons are inline SVG, every
  thumbnail/avatar/artwork is a generated gradient — no external requests at all

## Architecture

```
src/
  lib/
    data.ts        deterministic seeded mock-data engine (typed port of js/data.js)
    visuals.ts     generated gradients (thumbs, avatars, artworks)
  app/
    layout.tsx     fonts, metadata, toaster
    globals.css    Signal design system (dark, one accent, live-pulse signature)
    (app)/
      layout.tsx   shell: sidebar + topbar
      page.tsx     Today — daily brief, viral videos, sounds, hooks, hashtags, creators
      ideas/       Ideas — searchable, filterable idea feed
  components/      icons, shell, cards, command palette (⌘K), toasts
```

**State lives in the URL.** Country (`?country=`) and timeframe (`?tf=`) are
search params: pages are Server Components that derive the dataset server-side,
so every view is shareable, back-button friendly and rendered on the server.
The data engine is pure and seeded per `(country, timeframe)`, so server and
client always agree — swap `lib/data.ts` for a real API layer when a backend
lands.

## Security

- Strict `Content-Security-Policy` (self-only; no external hosts can load)
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`
- `poweredByHeader` disabled; search params validated/whitelisted before use
- No secrets, no cookies, no third-party scripts

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm start
```

## Next steps

- Auth + persistence (e.g. Supabase/Postgres) behind the existing data interface
- Real TikTok data ingestion feeding `Dataset`
- AI Copilot, Alerts and Settings pages (stubbed in the sidebar)
