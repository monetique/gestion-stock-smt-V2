#!/bin/bash

# Script pour résoudre le problème "Port 3000 already in use"
# Usage: ./scripts/fix-port-3000.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Résolution: Port 3000 déjà utilisé${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

APP_NAME="stock-app"

info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Fonction pour trouver le PID utilisant le port 3000
find_port_process() {
    # Essayer avec lsof
    if command -v lsof &> /dev/null; then
        PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
        if [ ! -z "$PID" ]; then
            echo "$PID"
            return 0
        fi
    fi
    
    # Essayer avec netstat
    if command -v netstat &> /dev/null; then
        PID=$(sudo netstat -tulpn 2>/dev/null | grep ":3000" | awk '{print $7}' | cut -d'/' -f1 | head -1)
        if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
            echo "$PID"
            return 0
        fi
    fi
    
    # Essayer avec ss
    if command -v ss &> /dev/null; then
        PID=$(sudo ss -tulpn 2>/dev/null | grep ":3000" | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
        if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
            echo "$PID"
            return 0
        fi
    fi
    
    return 1
}

echo -e "${BLUE}Étape 1: Recherche du processus utilisant le port 3000...${NC}"

PID=$(find_port_process)

if [ -z "$PID" ]; then
    warn "Aucun processus trouvé sur le port 3000 avec les méthodes standards"
    warn "Vérification avec PM2..."
    
    # Vérifier si c'est une instance PM2 zombie
    if pm2 list | grep -q "$APP_NAME"; then
        warn "Application trouvée dans PM2 mais peut-être dans un état incorrect"
        pm2 list | grep "$APP_NAME"
    fi
else
    info "Processus trouvé: PID $PID"
    
    # Voir les détails du processus
    echo "Détails du processus:"
    ps aux | grep "$PID" | grep -v grep || echo "Processus non trouvé"
    
    echo ""
    read -p "Voulez-vous arrêter ce processus? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo ""
        echo -e "${BLUE}Étape 2: Arrêt du processus...${NC}"
        
        # Essayer d'abord un arrêt gracieux
        kill -TERM "$PID" 2>/dev/null || sudo kill -TERM "$PID" 2>/dev/null
        
        # Attendre un peu
        sleep 2
        
        # Vérifier si le processus existe encore
        if ps -p "$PID" > /dev/null 2>&1; then
            warn "Le processus existe encore, arrêt forcé..."
            kill -9 "$PID" 2>/dev/null || sudo kill -9 "$PID" 2>/dev/null
            sleep 1
        fi
        
        # Vérifier que le port est libre
        NEW_PID=$(find_port_process)
        if [ -z "$NEW_PID" ]; then
            info "Port 3000 est maintenant libre"
        else
            error "Le port 3000 est toujours utilisé par PID $NEW_PID"
        fi
    else
        warn "Arrêt annulé. Vous devez arrêter le processus manuellement."
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Étape 3: Nettoyage des processus PM2...${NC}"

# Arrêter toutes les instances de l'application dans PM2
if pm2 list | grep -q "$APP_NAME"; then
    info "Arrêt de l'application dans PM2..."
    pm2 stop "$APP_NAME" 2>/dev/null || warn "Impossible d'arrêter $APP_NAME"
    pm2 delete "$APP_NAME" 2>/dev/null || warn "Impossible de supprimer $APP_NAME"
    sleep 2
fi

# Vérifier s'il y a d'autres processus Node.js zombies
echo ""
echo -e "${BLUE}Étape 4: Vérification des processus Node.js...${NC}"

NODE_PROCS=$(ps aux | grep -E "node.*stock|node.*next" | grep -v grep | wc -l || echo "0")
if [ "$NODE_PROCS" -gt 0 ]; then
    warn "$NODE_PROCS processus Node.js trouvé(s)"
    echo "Processus Node.js liés à l'application:"
    ps aux | grep -E "node.*stock|node.*next" | grep -v grep
    
    read -p "Voulez-vous arrêter tous ces processus Node.js? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ps aux | grep -E "node.*stock|node.*next" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
        info "Processus Node.js arrêtés"
        sleep 2
    fi
else
    info "Aucun processus Node.js zombie trouvé"
fi

echo ""
echo -e "${BLUE}Étape 5: Vérification finale du port 3000...${NC}"

FINAL_PID=$(find_port_process)
if [ -z "$FINAL_PID" ]; then
    info "✅ Port 3000 est libre"
else
    error "Port 3000 toujours utilisé par PID $FINAL_PID"
    warn "Vous devrez peut-être redémarrer le serveur ou vérifier les services systemd"
    
    # Vérifier systemd
    echo ""
    echo "Vérification des services systemd:"
    sudo systemctl list-units --type=service --all | grep -E "node|stock|gestion" || echo "Aucun service systemd trouvé"
fi

echo ""
echo -e "${BLUE}Étape 6: Redémarrage de l'application...${NC}"

# Aller dans le répertoire de l'application (d'après l'erreur: /var/www/stock-management)
APP_DIR="/var/www/stock-management"

if [ ! -d "$APP_DIR" ]; then
    warn "Répertoire $APP_DIR non trouvé"
    read -p "Entrez le chemin complet du répertoire de l'application: " APP_DIR
fi

if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    info "Répertoire: $APP_DIR"
    
    # Vérifier que package.json existe
    if [ ! -f "package.json" ]; then
        error "package.json non trouvé dans $APP_DIR"
        exit 1
    fi
    
    # Démarrer avec PM2
    echo ""
    echo "Démarrage de l'application avec PM2..."
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
    
    sleep 3
    
    # Vérifier le statut
    if pm2 list | grep -q "$APP_NAME.*online"; then
        info "✅ Application démarrée avec succès"
    else
        error "Application non démarrée correctement"
        warn "Vérifiez les logs: pm2 logs $APP_NAME"
    fi
else
    error "Répertoire $APP_DIR introuvable"
    warn "Démarrez l'application manuellement avec:"
    warn "  cd /chemin/vers/application"
    warn "  pm2 start npm --name \"$APP_NAME\" -- start"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Résolution terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Commandes utiles:"
echo "  • Voir le statut: pm2 status"
echo "  • Voir les logs: pm2 logs $APP_NAME"
echo "  • Redémarrer: pm2 restart $APP_NAME"
echo "  • Arrêter: pm2 stop $APP_NAME"
echo ""
echo -e "${YELLOW}⚠ Si le problème persiste:${NC}"
echo "  1. Vérifiez les services systemd: sudo systemctl list-units --type=service"
echo "  2. Vérifiez les processus: ps aux | grep node"
echo "  3. Vérifiez le port: sudo lsof -i :3000"
echo ""

