# ⚡ Guide Rapide de Déploiement - Commandes Essentielles

Guide condensé pour la mise à jour rapide sur RedHat.

---

## 🚀 Déploiement Automatique (Recommandé)

```bash
# 1. Se connecter au serveur
ssh user@votre-serveur

# 2. Aller dans le répertoire de l'application
cd /chemin/vers/gestion-stock-smt-V2

# 3. Exécuter le script de déploiement
./scripts/deploy.sh
```

Le script gère automatiquement toutes les étapes.

---

## 📝 Déploiement Manuel - Commandes Principales

### 1. Sauvegarde
```bash
# Sauvegarder la base de données
pg_dump -U postgres -d stock_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Sauvegarder .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Mise à jour depuis Git
```bash
git pull origin main
npm install
npx prisma generate
```

### 3. Configurer les Secrets JWT (IMPORTANT)
```bash
# Générer les secrets
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 32  # Pour JWT_REFRESH_SECRET

# Ajouter dans .env
nano .env
# Ajoutez:
# JWT_SECRET="votre-secret-genere"
# JWT_REFRESH_SECRET="votre-refresh-secret-genere"
```

### 4. Migrations Base de Données
```bash
npx prisma migrate deploy
```

### 5. Build
```bash
rm -rf .next
npm run build
```

### 6. Redémarrage
```bash
# Avec PM2
pm2 stop gestion-stock-smt-V2
pm2 restart gestion-stock-smt-V2

# Vérifier
pm2 logs gestion-stock-smt-V2 --lines 50
```

---

## ✅ Vérification Rapide

```bash
# Tester la connexion
curl http://localhost:3000

# Tester le login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monetique.tn","password":"votre-password"}'

# Vérifier les logs
pm2 logs gestion-stock-smt-V2 | tail -20
```

---

## 🔙 Rollback Rapide

```bash
# Restaurer la version précédente
git checkout <commit-hash-precedent>

# Restaurer la base de données
psql -U postgres -d stock_management < backup_YYYYMMDD_HHMMSS.sql

# Restaurer .env
cp .env.backup.YYYYMMDD_HHMMSS .env

# Rebuild et redémarrage
npm run build
pm2 restart gestion-stock-smt-V2
```

---

## ⚠️ Points Critiques

1. **JWT_SECRET et JWT_REFRESH_SECRET** - OBLIGATOIRES pour que l'authentification fonctionne
2. **Sauvegarde de la base de données** - Toujours faire avant la mise à jour
3. **Variables d'environnement** - Vérifier que .env contient toutes les variables nécessaires

---

Pour plus de détails, consultez `DEPLOYMENT_GUIDE.md`

