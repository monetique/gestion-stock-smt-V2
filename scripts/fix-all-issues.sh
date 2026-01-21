#!/bin/bash

# Script pour résoudre tous les problèmes : port, processus, rebuild
# Usage: ./scripts/fix-all-issues.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Résolution Complète des Problèmes${NC}"
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

echo -e "${BLUE}Étape 1: Arrêt de tous les processus...${NC}"

# Arrêter toutes les instances PM2
pm2 stop all 2>/dev/null || warn "Aucun processus PM2 à arrêter"
pm2 delete all 2>/dev/null || warn "Aucun processus PM2 à supprimer"

# Tuer tous les processus Node.js liés
pkill -f "node.*next" 2>/dev/null || warn "Aucun processus next trouvé"
pkill -f "node.*stock" 2>/dev/null || warn "Aucun processus stock trouvé"

sleep 2

echo ""
echo -e "${BLUE}Étape 2: Nettoyage du port 3000...${NC}"

# Trouver et tuer le processus sur le port 3000
PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
if [ ! -z "$PID" ]; then
    info "Arrêt du processus PID $PID sur le port 3000"
    sudo kill -9 "$PID" 2>/dev/null || true
    sleep 1
fi

# Vérifier avec netstat
PID=$(sudo netstat -tulpn 2>/dev/null | grep ":3000" | awk '{print $7}' | cut -d'/' -f1 | head -1)
if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    info "Arrêt du processus PID $PID trouvé via netstat"
    sudo kill -9 "$PID" 2>/dev/null || true
    sleep 1
fi

# Vérifier avec ss
PID=$(sudo ss -tulpn 2>/dev/null | grep ":3000" | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    info "Arrêt du processus PID $PID trouvé via ss"
    sudo kill -9 "$PID" 2>/dev/null || true
    sleep 1
fi

# Vérifier que le port est libre
FINAL_PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
if [ -z "$FINAL_PID" ]; then
    info "Port 3000 est maintenant libre"
else
    error "Port 3000 toujours utilisé par PID $FINAL_PID"
    warn "Tentative d'arrêt forcé..."
    sudo kill -9 "$FINAL_PID" 2>/dev/null || true
    sleep 2
fi

echo ""
echo -e "${BLUE}Étape 3: Vérification des fichiers d'environnement...${NC}"

# Vérifier les secrets JWT
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    if ! grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        warn "JWT_SECRET manquant, génération..."
        echo 'JWT_SECRET="'$(openssl rand -base64 32)'"' >> "$ENV_FILE"
        info "JWT_SECRET ajouté"
    fi
    
    if ! grep -q "^JWT_REFRESH_SECRET=" "$ENV_FILE"; then
        warn "JWT_REFRESH_SECRET manquant, génération..."
        echo 'JWT_REFRESH_SECRET="'$(openssl rand -base64 32)'"' >> "$ENV_FILE"
        info "JWT_REFRESH_SECRET ajouté"
    fi
else
    error "Fichier $ENV_FILE non trouvé!"
fi

echo ""
echo -e "${BLUE}Étape 4: Build de l'application...${NC}"

# Nettoyer le build précédent
rm -rf .next
info "Cache Next.js nettoyé"

# Rebuild
info "Build en cours..."
npm run build

if [ $? -eq 0 ]; then
    info "Build réussi"
else
    error "Échec du build"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 5: Démarrage de l'application...${NC}"

# Attendre un peu pour être sûr que le port est libre
sleep 2

# Démarrer avec PM2
pm2 start npm --name "$APP_NAME" -- start
pm2 save

sleep 3

# Vérifier le statut
if pm2 list | grep -q "$APP_NAME.*online"; then
    info "✅ Application démarrée avec succès"
else
    error "Application non démarrée correctement"
    warn "Vérifiez les logs: pm2 logs $APP_NAME"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 6: Vérification finale...${NC}"

# Vérifier le port
if sudo lsof -ti:3000 > /dev/null 2>&1; then
    info "Port 3000 est utilisé (normal)"
else
    warn "Port 3000 non utilisé - application peut ne pas être démarrée"
fi

# Vérifier les logs pour erreurs
ERROR_COUNT=$(pm2 logs "$APP_NAME" --lines 50 --nostream 2>/dev/null | grep -i "error\|EADDRINUSE" | wc -l || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    warn "$ERROR_COUNT erreur(s) trouvée(s) dans les logs récents"
else
    info "Aucune erreur récente"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Résolution terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Vérifications:"
echo "  • Tous les processus arrêtés"
echo "  • Port 3000 nettoyé"
echo "  • Secrets JWT vérifiés"
echo "  • Application rebuildée"
echo "  • Application redémarrée"
echo ""
echo "Commandes utiles:"
echo "  • Statut: pm2 status"
echo "  • Logs: pm2 logs $APP_NAME"
echo "  • Redémarrer: pm2 restart $APP_NAME"
echo ""

