#!/bin/bash

# Script pour tester la vérification JWT
# Usage: ./scripts/test-jwt.sh

set -e

echo "=== Test de vérification JWT ==="
echo ""

APP_DIR="/var/www/stock-management"
cd "$APP_DIR" || exit 1

# Vérifier que .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production non trouvé"
    exit 1
fi

# Charger les variables d'environnement
source .env.production 2>/dev/null || true

echo "1. Vérification des secrets JWT:"
if [ -z "$JWT_SECRET" ]; then
    echo "   ❌ JWT_SECRET non défini"
else
    echo "   ✓ JWT_SECRET défini (longueur: ${#JWT_SECRET} caractères)"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "   ❌ JWT_REFRESH_SECRET non défini"
else
    echo "   ✓ JWT_REFRESH_SECRET défini (longueur: ${#JWT_REFRESH_SECRET} caractères)"
fi

echo ""
echo "2. Vérification dans le code:"
echo "   Vérifiez les logs PM2 pour voir si JWT_SECRET est bien chargé:"
echo "   pm2 logs stock-app --lines 50 | grep -i jwt"

echo ""
echo "3. Test de connexion:"
echo "   Essayez de vous connecter et vérifiez les logs:"
echo "   pm2 logs stock-app --err --lines 20"

echo ""
echo "4. Si le problème persiste, vérifiez que les secrets sont identiques partout:"
echo "   - .env.production"
echo "   - Variables d'environnement PM2"
echo "   - Logs au démarrage de l'application"

