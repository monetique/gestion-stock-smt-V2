#!/bin/bash
set -e
APP_DIR="/var/www/stock-management"
info(){ echo -e "\033[1;34m[INFO]\033[0m $*"; }
ok(){ echo -e "\033[1;32m[OK]\033[0m $*"; }
err(){ echo -e "\033[1;31m[ERR]\033[0m $*"; }
info "Déploiement: Bon consolidé mouvements en masse"
cd "$APP_DIR" || { err "Répertoire introuvable"; exit 1; }
info "git pull"; git pull origin main || { err "git pull échoué"; exit 1; }
info "Nettoyage"; rm -rf .next node_modules/.cache || true
info "npm ci"; npm ci --prefer-offline --no-audit --no-fund || { err "npm ci échoué"; exit 1; }
[ -f prisma/schema.prisma ] && { info "prisma generate"; npx prisma generate || { err "prisma échoué"; exit 1; }; }
info "Build"; npm run build || { err "build échoué"; exit 1; }
info "PM2 restart"; pm2 restart stock-app --update-env || pm2 restart all || { err "PM2 échoué"; exit 1; }
sleep 8
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
echo "HTTP /: $HTTP_CODE"
ok "Déploiement terminé (bon consolidé activé)."
