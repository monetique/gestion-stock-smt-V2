#!/bin/bash

# Script pour forcer le rebuild du middleware
# Usage: ./scripts/rebuild-middleware.sh

set -e

APP_NAME="stock-app"
APP_DIR="/var/www/stock-management"

echo "🔧 Rebuild complet du middleware..."

cd "$APP_DIR" || exit 1

# Arrêter l'application
echo "Arrêt de l'application..."
pm2 stop "$APP_NAME" || true

# Supprimer complètement le cache Next.js
echo "Nettoyage du cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Rebuild complet
echo "Build de production..."
npm run build

# Redémarrer
echo "Redémarrage de l'application..."
pm2 start "$APP_NAME" || pm2 restart "$APP_NAME"
pm2 save

echo ""
echo "✅ Rebuild terminé!"
echo "Vérifiez les logs: pm2 logs $APP_NAME | grep '\[Middleware\]'"

