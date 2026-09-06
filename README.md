# The Daily Dispatch (starter)

A newspaper front page, built with Next.js + Tailwind, with a private
`/admin` editor for managing articles and where they sit on the page.
Everything is stored in a local JSON file (`data/articles.json`) — no
database or external service required to run it locally.

## 1. Install

From inside this folder:

```bash
npm install
```

## 2. Set your editor password

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and set your own `EDITOR_PASSWORD` and
`SESSION_SECRET` (any long random string for the latter). `.env.local`
is gitignored, so it stays out of your repo.

## 3. Run it

```bash
npm run dev
```

- Front page: http://localhost:3000
- Editor: http://localhost:3000/admin (asks for your `EDITOR_PASSWORD`)

The repo comes with 7 sample articles already placed in different
slots so you can see the layout working immediately. Edit or delete
them from `/admin`, or edit `data/articles.json` directly.

## How the front page is laid out

Every article has a `slot`, set from the editor:

- **hero** — the single lead story at the top (only one shows; if you
  place a second, the most recently ordered one wins).
- **hero-secondary** — runs just below the hero.
- **sidebar** — short list next to the lead package.
- **grid** — standard story cards in the grid below.
- **unplaced** — saved but not shown on the front page yet.

Within a slot, the `order` field controls the sequence (lower first).

## Project structure

```
app/
  page.tsx                  Front page
  article/[slug]/page.tsx   Article detail page
  admin/                    Private editor (protected by middleware.ts)
  api/articles/             REST endpoints the editor calls
  api/auth/                 Login/logout
components/                 Masthead, HeroStory, ArticleCard
lib/db.ts                   Reads/writes data/articles.json
lib/auth.ts                 Password + session check
data/articles.json          Your articles live here
```

## Before you deploy publicly

This starter is built for local development and is intentionally
simple:

- **Storage**: `data/articles.json` is read/written on disk. That
  works great locally, but most hosts (e.g. Vercel) run on read-only,
  ephemeral filesystems — writes from `/admin` won't persist. Before
  deploying, swap `lib/db.ts` for a real database (Postgres, SQLite on
  a persistent volume, etc.).
- **Auth**: the editor uses a single shared password compared to a
  cookie. Fine for your own machine; consider a real auth solution
  (e.g. NextAuth) if more than one person will ever manage this, or if
  it goes on the public internet.
- Images are loaded from remote URLs (e.g. Unsplash) via
  `next/image`. Swap in your own image hosting when you're ready.

## Customizing

- Masthead name/sections: `components/Masthead.tsx`
- Colors/fonts: `tailwind.config.ts` and `app/layout.tsx`
- Front page structure (hero + sidebar + grid): `app/page.tsx`
