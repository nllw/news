#!/usr/bin/env sh
# Boots a fresh database, seeds the admin, and starts the dev server for Playwright.
set -e
mkdir -p tests/tmp
rm -f tests/tmp/e2e.db tests/tmp/e2e.db-journal tests/tmp/e2e.db-wal tests/tmp/e2e.db-shm
npx prisma db push --skip-generate --force-reset >/dev/null
npx tsx prisma/seed.ts
exec npx next dev -p "${PORT:-3100}"
