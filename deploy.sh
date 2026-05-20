#!/usr/bin/env bash
# --- АВТОДЕПЛОЙ ПРИЛОЖЕНИЕ №2 (SOP) ---
set -euo pipefail
# ============================================================
# КОНФИГУРАЦИЯ — меняй только здесь
# ============================================================
APP_DIR="/var/www/sop"        # путь к папке приложения №2
BRANCH="main"                  # ветка GitHub
# ============================================================
cd "$APP_DIR"
echo "==> [1/8] Maintenance mode ON"
php artisan down || true
echo "==> [2/8] Git sync with origin/$BRANCH"
git fetch --all --prune
git reset --hard "origin/$BRANCH"
git clean -fd
echo "==> [3/8] Composer install (prod)"
echo "==> [3б/8] NPM build"
npm ci --production=false
npm run build
composer install --no-dev --optimize-autoloader --prefer-dist
echo "==> [4/8] Permissions for runtime dirs"
chgrp -R www-data storage bootstrap/cache public/build 2>/dev/null || true
chmod -R 775 storage bootstrap/cache public/build 2>/dev/null || true
echo "==> [5/8] Storage symlink (если нужен)"
php artisan storage:link 2>/dev/null || true
echo "==> [6/8] Migrate DB"
php artisan migrate --force
echo "==> [7/8] Cache refresh"
php artisan cache:clear
php artisan config:cache
php artisan route:clear
php artisan view:clear
if [ ! -f public/build/manifest.json ]; then
  echo "??  WARN: public/build/manifest.json не найден."
fi
echo "==> [8/8] Maintenance mode OFF"
php artisan up || true
echo "? Deploy SOP completed successfully."
