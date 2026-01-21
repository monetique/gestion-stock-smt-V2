#!/bin/bash

# Script pour générer les secrets JWT
# Usage: ./scripts/generate-jwt-secrets.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/stock-management"

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 Génération des secrets JWT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

cd "$APP_DIR" || exit 1

# Générer les secrets
echo "Génération des secrets JWT..."
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo ""
echo -e "${GREEN}✓ Secrets générés avec succès!${NC}"
echo ""
echo "Voici vos secrets :"
echo ""
echo "JWT_SECRET :"
echo "$JWT_SECRET"
echo ""
echo "JWT_REFRESH_SECRET :"
echo "$JWT_REFRESH_SECRET"
echo ""

# Demander si l'utilisateur veut les ajouter à .env.production
read -p "Voulez-vous ajouter ces secrets à .env.production ? (Y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Vérifier si .env.production existe
    if [ ! -f ".env.production" ]; then
        echo "Création de .env.production..."
        touch .env.production
    fi
    
    # Supprimer les anciennes valeurs si elles existent
    sed -i '/^JWT_SECRET=/d' .env.production
    sed -i '/^JWT_REFRESH_SECRET=/d' .env.production
    
    # Ajouter les nouvelles valeurs
    echo "" >> .env.production
    echo "# Secrets JWT (générés le $(date '+%Y-%m-%d %H:%M:%S'))" >> .env.production
    echo "JWT_SECRET=\"$JWT_SECRET\"" >> .env.production
    echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"" >> .env.production
    
    echo ""
    echo -e "${GREEN}✓ Secrets ajoutés à .env.production${NC}"
    echo ""
    echo "⚠️  IMPORTANT: Redémarrez l'application pour appliquer les changements:"
    echo "   pm2 restart stock-app"
else
    echo ""
    echo "Les secrets n'ont pas été ajoutés automatiquement."
    echo "Ajoutez-les manuellement dans .env.production:"
    echo ""
    echo "JWT_SECRET=\"$JWT_SECRET\""
    echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\""
fi

echo ""

