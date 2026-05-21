#!/usr/bin/env bash
# --- AUTODEPLOY APP #2 (SOP) ---
set -euo pipefail

APP_DIR="/var/www/sop"
BRANCH="main"

cd "$APP_DIR"

echo "==> [1/9] Maintenance mode ON"
php artisan down || true

echo "==> [2/9] Git sync"
git fetch --all --prune
git reset --hard "origin/$BRANCH"
git clean -fd --exclude=deploy.sh

echo "==> [3/9] Composer install"
composer install --no-dev --optimize-autoloader --prefer-dist

echo "==> [4/9] NPM build"
npm ci
npm run build

echo "==> [5/9] Permissions"
chgrp -R www-data storage bootstrap/cache public/build 2>/dev/null || true
chmod -R 775 storage bootstrap/cache public/build 2>/dev/null || true

echo "==> [6/9] Storage symlink"
php artisan storage:link 2>/dev/null || true

echo "==> [7/9] Migrate DB"
php artisan migrate --force

echo "==> [8/9] Cache refresh"
php artisan cache:clear
php artisan config:cache
php artisan route:clear
php artisan view:clear

echo "==> [9/9] Maintenance mode OFF"
php artisan up || true

echo "==> SUCCESS: SOP deployed."
