#!/bin/bash

# Script de diagnostic pour erreur 401 sur /api/auth/me
# Usage: ./scripts/diagnose-401.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="stock-app"
APP_DIR="/var/www/stock-management"

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Diagnostic Erreur 401 - /api/auth/me${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

cd "$APP_DIR" || exit 1

echo -e "${BLUE}1. Vérification JWT_SECRET dans .env.production...${NC}"
if [ -f ".env.production" ]; then
    JWT_SECRET=$(grep "^JWT_SECRET=" .env.production | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}✗ JWT_SECRET non défini dans .env.production${NC}"
    else
        LEN=${#JWT_SECRET}
        echo -e "${GREEN}✓ JWT_SECRET trouvé (longueur: $LEN caractères)${NC}"
        if [ $LEN -lt 32 ]; then
            echo -e "${YELLOW}⚠ JWT_SECRET trop court (minimum 32 caractères)${NC}"
        fi
    fi
else
    echo -e "${RED}✗ .env.production non trouvé${NC}"
fi

echo ""
echo -e "${BLUE}2. Derniers logs du middleware...${NC}"
pm2 logs "$APP_NAME" --lines 50 --nostream 2>/dev/null | grep -E "\[Middleware\]|\[JWT\]|\[API /auth/me\]" | tail -20 || echo "Aucun log trouvé"

echo ""
echo -e "${BLUE}3. Dernières erreurs...${NC}"
pm2 logs "$APP_NAME" --err --lines 30 --nostream 2>/dev/null | tail -20 || echo "Aucune erreur récente"

echo ""
echo -e "${BLUE}4. Vérification que l'application est en ligne...${NC}"
if pm2 list | grep -q "$APP_NAME.*online"; then
    echo -e "${GREEN}✓ Application en ligne${NC}"
else
    echo -e "${RED}✗ Application non en ligne${NC}"
    pm2 status
fi

echo ""
echo -e "${BLUE}5. Test local de l'API (nécessite un token valide)...${NC}"
echo "Pour tester manuellement, utilisez:"
echo "  curl -H 'Authorization: Bearer VOTRE_TOKEN' http://localhost:3000/api/auth/me"

echo ""
echo -e "${BLUE}6. Commandes utiles:${NC}"
echo "  - Voir les logs en temps réel: pm2 logs $APP_NAME"
echo "  - Voir uniquement les logs JWT: pm2 logs $APP_NAME | grep '\[JWT\]'"
echo "  - Voir uniquement les logs Middleware: pm2 logs $APP_NAME | grep '\[Middleware\]'"
echo "  - Redémarrer: pm2 restart $APP_NAME"

echo ""
echo -e "${YELLOW}⚠ Points à vérifier:${NC}"
echo "  1. JWT_SECRET est défini et a au moins 32 caractères"
echo "  2. Le token envoyé par le client est valide (pas expiré)"
echo "  3. Le token a été signé avec le même JWT_SECRET"
echo "  4. Le header Authorization est bien envoyé avec 'Bearer TOKEN'"

echo ""

