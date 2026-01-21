#!/bin/bash

# Script pour résoudre les erreurs de chunks Next.js
# Usage: ./scripts/fix-chunk-errors.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Résolution Erreurs Chunks Next.js${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

APP_NAME="stock-management"
APP_DIR="/var/www/stock-management"

info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier le répertoire
if [ ! -d "$APP_DIR" ]; then
    error "Répertoire $APP_DIR non trouvé"
    read -p "Entrez le chemin complet: " APP_DIR
fi

cd "$APP_DIR" || exit 1

echo -e "${BLUE}Étape 1: Arrêt de l'application...${NC}"

# Arrêter toutes les instances
pm2 stop all 2>/dev/null || warn "Aucun processus PM2 à arrêter"
pm2 delete all 2>/dev/null || warn "Aucun processus PM2 à supprimer"

sleep 2

echo ""
echo -e "${BLUE}Étape 2: Nettoyage complet du cache Next.js...${NC}"

# Supprimer complètement .next
rm -rf .next
info "Dossier .next supprimé"

# Nettoyer aussi les caches npm
rm -rf node_modules/.cache 2>/dev/null || true
info "Cache npm nettoyé"

# Nettoyer le cache Next.js dans node_modules
find node_modules/.next -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true

echo ""
echo -e "${BLUE}Étape 3: Vérification des fichiers essentiels...${NC}"

# Vérifier package.json
if [ ! -f "package.json" ]; then
    error "package.json non trouvé"
    exit 1
fi
info "package.json trouvé"

# Vérifier les variables d'environnement
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    info "Fichier d'environnement: $ENV_FILE"
    
    # Vérifier les secrets JWT
    if ! grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        warn "JWT_SECRET manquant, génération..."
        echo 'JWT_SECRET="'$(openssl rand -base64 32)'"' >> "$ENV_FILE"
    fi
    
    if ! grep -q "^JWT_REFRESH_SECRET=" "$ENV_FILE"; then
        warn "JWT_REFRESH_SECRET manquant, génération..."
        echo 'JWT_REFRESH_SECRET="'$(openssl rand -base64 32)'"' >> "$ENV_FILE"
    fi
else
    warn "Fichier d'environnement non trouvé"
fi

echo ""
echo -e "${BLUE}Étape 4: Rebuild complet...${NC}"

# Build propre
info "Build en cours (cela peut prendre quelques minutes)..."
npm run build

if [ $? -eq 0 ]; then
    info "Build réussi"
else
    error "Échec du build"
    exit 1
fi

# Vérifier que les chunks sont bien générés
if [ -d ".next/static/chunks" ]; then
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" | wc -l)
    info "$CHUNK_COUNT chunks générés"
else
    error "Aucun chunk généré - problème de build"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 5: Nettoyage du port 3000...${NC}"

# Tuer tous les processus sur le port 3000
PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
if [ ! -z "$PID" ]; then
    info "Arrêt du processus PID $PID sur le port 3000"
    sudo kill -9 "$PID" 2>/dev/null || true
    sleep 2
fi

# Vérifier que le port est libre
FINAL_PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
if [ -z "$FINAL_PID" ]; then
    info "Port 3000 est libre"
else
    error "Port 3000 toujours utilisé"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 6: Démarrage de l'application...${NC}"

# Démarrer avec PM2
pm2 start npm --name "$APP_NAME" -- start
pm2 save

sleep 5

# Vérifier le statut
if pm2 list | grep -q "$APP_NAME.*online"; then
    info "✅ Application démarrée"
else
    error "Application non démarrée"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 7: Vérification finale...${NC}"

# Vérifier que le serveur répond
sleep 2
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    info "Serveur répond sur le port 3000"
else
    warn "Serveur ne répond pas - vérifiez les logs"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Résolution terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT - Actions côté navigateur:${NC}"
echo "  1. Videz complètement le cache du navigateur"
echo "  2. Faites un Hard Refresh (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "  3. Ou ouvrez en navigation privée pour tester"
echo ""
echo "Si le problème persiste, videz le cache du navigateur :"
echo "  Chrome/Edge: F12 > Network > Cochez 'Disable cache'"
echo "  Firefox: F12 > Network > Clic droit > 'Clear All'"
echo ""

