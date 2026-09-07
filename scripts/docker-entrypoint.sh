#!/bin/sh
# Apply pending migrations, seed the first admin if configured, then start.
set -e
echo "Applying database migrations…"
node node_modules/prisma/build/index.js migrate deploy
if [ -n "$SEED_ADMIN_EMAIL" ] && [ -n "$SEED_ADMIN_PASSWORD" ]; then
  echo "Ensuring admin account and default sections…"
  node node_modules/prisma/build/index.js db seed || echo "Seed skipped (already seeded or tsx unavailable)."
fi
exec "$@"
