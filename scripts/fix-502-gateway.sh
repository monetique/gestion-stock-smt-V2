#!/bin/bash

# Script pour résoudre l'erreur 502 Bad Gateway
# Usage: ./scripts/fix-502-gateway.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Résolution Erreur 502 Bad Gateway${NC}"
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

echo -e "${BLUE}Étape 1: Diagnostic initial...${NC}"

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    error "PM2 non trouvé!"
    exit 1
fi

# Vérifier le statut de l'application
if pm2 list | grep -q "$APP_NAME.*online"; then
    info "Application trouvée dans PM2"
else
    warn "Application non trouvée ou non en ligne dans PM2"
fi

# Vérifier le port 3000
if sudo netstat -tulpn 2>/dev/null | grep -q ":3000" || sudo ss -tulpn 2>/dev/null | grep -q ":3000"; then
    info "Port 3000 est utilisé"
else
    error "Port 3000 non utilisé - application probablement arrêtée"
fi

# Tester localement
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    info "Application répond sur localhost:3000"
else
    error "Application ne répond PAS sur localhost:3000"
fi

echo ""
echo -e "${BLUE}Étape 2: Arrêt et nettoyage...${NC}"

# Arrêter toutes les instances
pm2 stop all 2>/dev/null || warn "Aucun processus à arrêter"
pm2 delete all 2>/dev/null || warn "Aucun processus à supprimer"

# Tuer les processus zombies
sudo pkill -f "node.*next" 2>/dev/null || true
sudo pkill -f "node.*stock" 2>/dev/null || true

# Libérer le port 3000
PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
if [ ! -z "$PID" ]; then
    info "Arrêt du processus PID $PID sur le port 3000"
    sudo kill -9 "$PID" 2>/dev/null || true
    sleep 2
fi

echo ""
echo -e "${BLUE}Étape 3: Vérification des fichiers...${NC}"

# Vérifier package.json
if [ ! -f "package.json" ]; then
    error "package.json non trouvé"
    exit 1
fi

# Vérifier le build
if [ ! -d ".next" ]; then
    warn "Dossier .next non trouvé - rebuild nécessaire"
    echo ""
    echo -e "${BLUE}Étape 4: Build de l'application...${NC}"
    npm run build
fi

echo ""
echo -e "${BLUE}Étape 5: Démarrage de l'application...${NC}"

# Démarrer avec PM2
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# Attendre le démarrage
echo "Attente du démarrage..."
sleep 5

# Vérifier le statut
if pm2 list | grep -q "$APP_NAME.*online"; then
    info "Application démarrée"
else
    error "Application non démarrée"
    warn "Logs:"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 6: Test de l'application...${NC}"

# Attendre un peu plus
sleep 3

# Tester localement
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    info "✅ Application répond sur localhost:3000"
else
    error "Application ne répond toujours pas"
    warn "Vérifiez les logs: pm2 logs $APP_NAME"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 7: Vérification Nginx...${NC}"

# Vérifier Nginx
if command -v nginx &> /dev/null; then
    # Vérifier la configuration
    if sudo nginx -t 2>/dev/null; then
        info "Configuration Nginx valide"
        
        # Vérifier que proxy_pass pointe vers localhost:3000
        NGINX_CONF=$(sudo grep -r "proxy_pass.*3000" /etc/nginx/ 2>/dev/null | head -1)
        if [ ! -z "$NGINX_CONF" ]; then
            info "Nginx configuré pour proxy vers le port 3000"
        else
            warn "Configuration proxy_pass non trouvée dans Nginx"
        fi
        
        # Recharger Nginx
        read -p "Recharger Nginx? (Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            sudo systemctl reload nginx
            info "Nginx rechargé"
        fi
    else
        warn "Configuration Nginx invalide - vérifiez manuellement"
    fi
else
    warn "Nginx non trouvé - configuration proxy peut être ailleurs"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Résolution terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Vérifications:"
echo "  • Application démarrée: $(pm2 list | grep -q "$APP_NAME.*online" && echo 'Oui' || echo 'Non')"
echo "  • Port 3000: $(sudo lsof -ti:3000 > /dev/null 2>&1 && echo 'Utilisé' || echo 'Libre')"
echo "  • Application répond: $(curl -s http://localhost:3000 > /dev/null 2>&1 && echo 'Oui' || echo 'Non')"
echo ""
echo "Commandes utiles:"
echo "  • Logs: pm2 logs $APP_NAME"
echo "  • Statut: pm2 status"
echo "  • Test local: curl http://localhost:3000"
echo ""
echo -e "${YELLOW}⚠ Si l'erreur 502 persiste:${NC}"
echo "  1. Vérifiez la configuration Nginx: sudo nano /etc/nginx/sites-available/gstock.monetiquetunisie.com"
echo "  2. Vérifiez les logs Nginx: sudo tail -f /var/log/nginx/error.log"
echo "  3. Vérifiez que proxy_pass pointe vers http://localhost:3000"
echo ""

