#!/bin/bash

# Script de vérification de l'installation
# Usage: ./scripts/verify-installation.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="stock-app"
APP_DIR="/var/www/stock-management"
ADMIN_EMAIL="mohamed.boujelbane@monetiquetunisie.com"

info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Vérification de l'installation${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

cd "$APP_DIR" || exit 1

# 1. Vérifier PM2
echo -e "${BLUE}1. Vérification PM2...${NC}"
if pm2 list | grep -q "$APP_NAME.*online"; then
    info "Application $APP_NAME est en ligne"
    STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
    RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
    echo "   Statut: $STATUS"
    echo "   Redémarrages: $RESTARTS"
else
    error "Application $APP_NAME n'est pas en ligne"
fi

# 2. Vérifier le port
echo ""
echo -e "${BLUE}2. Vérification du port 3000...${NC}"
if sudo netstat -tulpn 2>/dev/null | grep -q ":3000" || sudo ss -tulpn 2>/dev/null | grep -q ":3000"; then
    PID=$(sudo lsof -ti:3000 2>/dev/null || echo "")
    if [ ! -z "$PID" ]; then
        info "Port 3000 utilisé par le processus PID: $PID"
    else
        info "Port 3000 utilisé"
    fi
else
    error "Port 3000 non utilisé"
fi

# 3. Tester HTTP
echo ""
echo -e "${BLUE}3. Test HTTP local...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    info "Application répond correctement (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    info "Application répond avec redirection (HTTP $HTTP_CODE) - normal"
else
    warn "Application répond avec HTTP $HTTP_CODE"
fi

# 4. Vérifier les erreurs récentes
echo ""
echo -e "${BLUE}4. Vérification des erreurs récentes...${NC}"
ERROR_COUNT=$(pm2 logs "$APP_NAME" --err --lines 50 --nostream 2>/dev/null | grep -i "error\|fatal" | wc -l || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    info "Aucune erreur critique récente"
else
    warn "$ERROR_COUNT erreur(s) trouvée(s) dans les logs"
    echo "   Dernières erreurs:"
    pm2 logs "$APP_NAME" --err --lines 3 --nostream 2>/dev/null | tail -3 | sed 's/^/   /' || true
fi

# 5. Vérifier les warnings
echo ""
echo -e "${BLUE}5. Vérification des warnings...${NC}"
WARN_COUNT=$(pm2 logs "$APP_NAME" --lines 50 --nostream 2>/dev/null | grep -i "warn" | wc -l || echo "0")
if [ "$WARN_COUNT" -eq 0 ]; then
    info "Aucun warning récent"
else
    warn "$WARN_COUNT warning(s) trouvé(s)"
    echo "   Derniers warnings:"
    pm2 logs "$APP_NAME" --lines 20 --nostream 2>/dev/null | grep -i "warn" | tail -3 | sed 's/^/   /' || true
fi

# 6. Vérifier la configuration
echo ""
echo -e "${BLUE}6. Vérification de la configuration...${NC}"
if [ -f ".env.production" ]; then
    info "Fichier .env.production existe"
    
    # Vérifier JWT_SECRET
    if grep -q "JWT_SECRET=" .env.production && ! grep -q "JWT_SECRET=\"\"" .env.production; then
        info "JWT_SECRET configuré"
    else
        error "JWT_SECRET manquant ou vide"
    fi
    
    # Vérifier JWT_REFRESH_SECRET
    if grep -q "JWT_REFRESH_SECRET=" .env.production && ! grep -q "JWT_REFRESH_SECRET=\"\"" .env.production; then
        info "JWT_REFRESH_SECRET configuré"
    else
        error "JWT_REFRESH_SECRET manquant ou vide"
    fi
    
    # Vérifier DATABASE_URL
    if grep -q "DATABASE_URL=" .env.production; then
        info "DATABASE_URL configuré"
    else
        error "DATABASE_URL manquant"
    fi
else
    error ".env.production non trouvé"
fi

# 7. Vérifier l'utilisateur admin
echo ""
echo -e "${BLUE}7. Vérification de l'utilisateur admin...${NC}"
cat > /tmp/verify-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      console.log(`OK:${user.email}:${user.role}:${user.isActive}`);
    } else {
      console.log(`NOT_FOUND:${email}`);
    }
  } catch (error) {
    console.log(`ERROR:${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();
EOF

ADMIN_RESULT=$(ADMIN_EMAIL="$ADMIN_EMAIL" node /tmp/verify-admin.js 2>/dev/null || echo "ERROR:Script failed")
rm -f /tmp/verify-admin.js

if [[ "$ADMIN_RESULT" == OK:* ]]; then
    EMAIL=$(echo "$ADMIN_RESULT" | cut -d: -f2)
    ROLE=$(echo "$ADMIN_RESULT" | cut -d: -f3)
    ACTIVE=$(echo "$ADMIN_RESULT" | cut -d: -f4)
    info "Utilisateur admin trouvé: $EMAIL"
    echo "   Rôle: $ROLE"
    echo "   Actif: $ACTIVE"
elif [[ "$ADMIN_RESULT" == NOT_FOUND:* ]]; then
    EMAIL=$(echo "$ADMIN_RESULT" | cut -d: -f2)
    error "Utilisateur admin non trouvé: $EMAIL"
    warn "Exécutez: ./scripts/create-admin.sh"
else
    warn "Impossible de vérifier l'utilisateur admin"
fi

# 8. Vérifier Nginx (si disponible)
echo ""
echo -e "${BLUE}8. Vérification Nginx...${NC}"
if command -v nginx &> /dev/null; then
    if sudo nginx -t 2>/dev/null; then
        info "Configuration Nginx valide"
        
        # Vérifier proxy_pass
        NGINX_CONF=$(sudo grep -r "proxy_pass.*3000" /etc/nginx/ 2>/dev/null | head -1 || echo "")
        if [ ! -z "$NGINX_CONF" ]; then
            info "Nginx configuré pour proxy vers le port 3000"
        else
            warn "Configuration proxy_pass non trouvée"
        fi
    else
        warn "Configuration Nginx invalide"
    fi
else
    warn "Nginx non trouvé"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Vérification terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Informations importantes:"
echo "  • Email admin: $ADMIN_EMAIL"
echo "  • URL locale: http://localhost:3000"
echo "  • URL publique: https://gstock.monetiquetunisie.com"
echo ""
echo "Commandes utiles:"
echo "  • Logs: pm2 logs $APP_NAME"
echo "  • Redémarrer: pm2 restart $APP_NAME"
echo "  • Statut: pm2 status"
echo ""

