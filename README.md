# Broadsheet

A newspaper website built with Next.js 14, Prisma, and SQLite, with a full newsroom admin.

**Readers get:** a curated front page, section, author, tag, and latest pages, search, article pages with structured data and social previews, RSS, sitemaps, dark mode, and print styles.

**Editors get:** email and password accounts with Admin and Editor roles, a rich-text editor with image uploads, drafts, scheduling, autosave, revision history, a drag-and-drop front page builder, a media library, and management of sections, authors, tags, users, and site settings.

## Run it locally

Requirements: Node 20.

```bash
npm install
cp .env.example .env               # DATABASE_URL for the Prisma CLI
cp .env.local.example .env.local   # everything else; set AUTH_SECRET and the seed admin
npm run db:migrate                 # creates data/app.db and applies migrations
npm run db:seed                    # default sections and the first admin account
npm run dev
```

- Site: http://localhost:3000
- Newsroom: http://localhost:3000/admin (sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)

Generate a secret with `openssl rand -base64 32`.

### Importing the old JSON store

If you have a `data/articles.json` from the earlier version:

```bash
npm run import:json
```

It maps sections and bylines, converts paragraphs to HTML, downloads the image through the upload pipeline, and preserves slugs. Safe to run twice.

## Scripts

| Command                                                 | What it does                                             |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `npm run dev`                                           | Development server                                       |
| `npm run build` / `npm start`                           | Production build; `start` runs migrations first          |
| `npm run lint` / `npm run typecheck` / `npm run format` | Quality checks                                           |
| `npm test`                                              | Unit and repository tests (Vitest, temp SQLite database) |
| `npm run test:e2e`                                      | Playwright smoke tests against a seeded dev server       |
| `npm run db:migrate`                                    | Create and apply a migration in development              |
| `npm run db:studio`                                     | Browse the database                                      |

## Configuration

All environment variables are validated at boot in [lib/env.ts](lib/env.ts). In production the server refuses to start if anything required is missing.

| Variable                                                                                             | Purpose                                                           |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`                                                                                       | SQLite file, e.g. `file:../data/app.db` (relative to `prisma/`)   |
| `AUTH_SECRET`                                                                                        | Signs sessions. At least 32 characters                            |
| `AUTH_URL`                                                                                           | Public origin in production                                       |
| `NEXT_PUBLIC_SITE_URL`                                                                               | Used for canonical URLs, feeds, sitemaps, and social cards        |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`                                                            | First admin, created by the seed when no admin exists             |
| `STORAGE_DRIVER`                                                                                     | `local` (files under `UPLOADS_DIR`, served at `/uploads`) or `s3` |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | S3-compatible storage (AWS S3, Cloudflare R2, MinIO)              |
| `CRON_SECRET`                                                                                        | Optional bearer token for `GET /api/cron/publish`                 |

## How publishing works

- **Status**: Draft, Scheduled, Published, Archived. Only Published stories, and Scheduled stories whose time has passed, appear on the public site.
- **Scheduling**: a scheduled story becomes visible automatically when its time arrives. `GET /api/cron/publish` flips its status to Published for tidiness; point any scheduler at it.
- **Front page**: stories are placed into four slots (lead, beside the lead, also reading, more stories). Everything else flows into section blocks and the "most recent" list automatically. Arrange slots at `/admin/front-page`.
- **Slugs**: generated from the headline until locked or published. Changing a live slug adds a permanent redirect from the old address.
- **Revisions**: every save stores a snapshot. The newest 20 per article are kept and can be compared and restored.
- **Caching**: public pages are statically rendered and revalidated by tag when content changes, with a 60 second floor.

## Roles

|                                                               | Editor | Admin |
| ------------------------------------------------------------- | ------ | ----- |
| Write, edit, publish, schedule, archive                       | ✓      | ✓     |
| Arrange the front page, manage media and tags, create authors | ✓      | ✓     |
| Delete articles                                               |        | ✓     |
| Manage sections, users, and site settings                     |        | ✓     |

## Deploying

The app runs on any single server with a persistent disk. A `Dockerfile` and `docker-compose.yml` are included:

```bash
cp .env.production.example .env.production   # fill in secrets
docker compose up -d --build
```

Migrations run on start, the first admin is created from the seed variables, and the SQLite file and uploads live on named volumes. Put a TLS-terminating proxy (Caddy, nginx, a platform load balancer) in front of port 3000.

## Project structure

```
app/(site)/            Public pages: front page, article, section, author, tag, latest, search, about, contact
app/admin/             Newsroom: login, dashboard, articles, editor, front page, media, taxonomy, users, settings
app/admin/actions/     Server actions (all mutations go through these with role checks and Zod validation)
app/api/               Public read API, upload endpoint, Auth.js, cron
components/            Public components, admin components, UI primitives
lib/data/              Prisma queries and cache tags
lib/validation/        Zod schemas shared by the editor and the server
lib/                   env, auth guards, slug, sanitiser, images, storage adapters
prisma/                Schema, migrations, seed
tests/, e2e/           Vitest and Playwright
```

## Public API

- `GET /api/articles?page=1&section=politics` — published articles, newest first
- `GET /api/articles/:slug` — one published article, including sanitised body HTML
- `GET /feed.xml` — RSS 2.0
- `GET /sitemap.xml`, `GET /news-sitemap.xml`, `GET /robots.txt`
