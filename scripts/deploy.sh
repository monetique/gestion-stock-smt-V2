#!/bin/bash

# Script de déploiement pour gestion-stock-smt-V2
# À exécuter depuis le répertoire racine de l'application sur le serveur

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="gestion-stock-smt-V2"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}🚀 Début du déploiement de ${APP_NAME}${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Erreur: package.json introuvable. Exécutez ce script depuis le répertoire racine de l'application."
    exit 1
fi

# Étape 1: Créer le répertoire de sauvegarde
info "Création du répertoire de sauvegarde..."
mkdir -p "$BACKUP_DIR"

# Étape 2: Sauvegarde Git
info "Création d'une branche de sauvegarde Git..."
git checkout -b "backup-$TIMESTAMP" 2>/dev/null || warn "Branche de sauvegarde déjà créée ou impossible"
git checkout main 2>/dev/null || git checkout master

# Étape 3: Sauvegarde de la base de données
info "Sauvegarde de la base de données..."
if command -v pg_dump &> /dev/null; then
    # Essayer de détecter la base de données depuis .env
    if [ -f ".env" ]; then
        DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ ! -z "$DB_URL" ]; then
            BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
            # Extraire les informations de connexion de l'URL
            # Note: Cette méthode est basique, vous devrez peut-être l'ajuster
            warn "Sauvegarde de la base de données..."
            warn "Veuillez exécuter manuellement: pg_dump -U votre_user -d votre_database > $BACKUP_FILE"
        fi
    fi
else
    warn "pg_dump non trouvé. Sauvegardez manuellement votre base de données."
fi

# Étape 4: Sauvegarde du fichier .env
info "Sauvegarde du fichier .env..."
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env.backup.$TIMESTAMP"
    info "Fichier .env sauvegardé dans $BACKUP_DIR/.env.backup.$TIMESTAMP"
else
    warn "Fichier .env introuvable. Assurez-vous qu'il existe."
fi

# Étape 5: Sauvegarde des modifications Git locales
info "Sauvegarde des modifications locales..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    git stash save "Sauvegarde avant déploiement $TIMESTAMP"
    info "Modifications locales sauvegardées dans stash"
fi

# Étape 6: Récupérer les mises à jour depuis Git
info "Récupération des mises à jour depuis Git..."
git fetch origin
git pull origin main || git pull origin master
info "Code mis à jour"

# Étape 7: Installer les dépendances
info "Installation des dépendances npm..."
npm install
info "Dépendances installées"

# Étape 8: Régénérer Prisma Client
info "Régénération du client Prisma..."
npx prisma generate
info "Client Prisma régénéré"

# Étape 9: Vérifier les variables d'environnement JWT
info "Vérification des variables d'environnement JWT..."
if [ -f ".env" ]; then
    if ! grep -q "JWT_SECRET" .env; then
        warn "JWT_SECRET non trouvé dans .env"
        warn "IMPORTANT: Ajoutez JWT_SECRET dans .env avant de continuer"
        warn "Générez avec: openssl rand -base64 32"
        read -p "Voulez-vous continuer sans JWT_SECRET? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Déploiement annulé. Configurez JWT_SECRET et JWT_REFRESH_SECRET dans .env"
            exit 1
        fi
    fi
    
    if ! grep -q "JWT_REFRESH_SECRET" .env; then
        warn "JWT_REFRESH_SECRET non trouvé dans .env"
        warn "IMPORTANT: Ajoutez JWT_REFRESH_SECRET dans .env avant de continuer"
        warn "Générez avec: openssl rand -base64 32"
    fi
else
    error "Fichier .env introuvable. Créez-le avec les variables nécessaires."
    exit 1
fi

# Étape 10: Migrations de base de données
info "Vérification des migrations de base de données..."
if command -v npx &> /dev/null; then
    npx prisma migrate status 2>/dev/null || warn "Impossible de vérifier le statut des migrations"
    read -p "Appliquer les migrations? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma migrate deploy || warn "Erreur lors des migrations. Vérifiez manuellement."
    fi
else
    warn "npx non trouvé. Vérifiez manuellement les migrations."
fi

# Étape 11: Build de production
info "Build de production en cours..."
rm -rf .next
npm run build
if [ $? -eq 0 ]; then
    info "Build réussi"
else
    error "Échec du build. Vérifiez les erreurs ci-dessus."
    exit 1
fi

# Étape 12: Arrêter l'application
info "Arrêt de l'application..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 stop "$APP_NAME" || warn "Impossible d'arrêter l'application PM2"
        info "Application arrêtée (PM2)"
    else
        warn "Application $APP_NAME non trouvée dans PM2"
    fi
else
    warn "PM2 non trouvé. Arrêtez manuellement l'application."
    read -p "L'application est-elle arrêtée? (Y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        error "Déploiement annulé. Arrêtez l'application manuellement."
        exit 1
    fi
fi

# Étape 13: Redémarrer l'application
info "Redémarrage de l'application..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart "$APP_NAME"
        pm2 save
        info "Application redémarrée (PM2)"
    else
        warn "Application non trouvée dans PM2. Démarrage..."
        pm2 start npm --name "$APP_NAME" -- start
        pm2 save
        info "Application démarrée (PM2)"
    fi
else
    warn "PM2 non trouvé. Démarrez manuellement l'application avec: npm start"
fi

# Étape 14: Vérification
info "Vérification de l'application..."
sleep 5

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "$APP_NAME.*online"; then
        info "Application en ligne (PM2)"
    else
        error "Application non en ligne. Vérifiez les logs: pm2 logs $APP_NAME"
    fi
fi

# Résumé
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "Sauvegardes créées dans: $BACKUP_DIR/"
echo "Timestamp: $TIMESTAMP"
echo ""
echo "Commandes utiles:"
echo "  - Voir les logs: pm2 logs $APP_NAME"
echo "  - Voir le statut: pm2 status"
echo "  - Redémarrer: pm2 restart $APP_NAME"
echo ""
echo -e "${YELLOW}⚠ N'oubliez pas de:${NC}"
echo "  1. Tester la connexion à l'application"
echo "  2. Vérifier que JWT_SECRET et JWT_REFRESH_SECRET sont configurés"
echo "  3. Vérifier les logs pour détecter les erreurs"
echo ""

