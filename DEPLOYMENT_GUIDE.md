# 🚀 Guide de Mise à Jour - Déploiement sur RedHat

Ce guide détaille les étapes pour mettre à jour l'application depuis Git sur un serveur RedHat en production.

---

## 📋 Prérequis

- Accès SSH au serveur RedHat
- Git installé sur le serveur
- Node.js et npm installés
- PostgreSQL en cours d'exécution
- PM2 ou service système configuré pour gérer l'application
- Accès à la base de données PostgreSQL

---

## 🔐 Étape 1: Connexion au Serveur

```bash
ssh user@votre-serveur-redhat
cd /chemin/vers/votre/application
```

**Exemple:**
```bash
ssh admin@192.168.1.100
cd /opt/gestion-stock-smt-V2
```

---

## 💾 Étape 2: Sauvegarde de la Version Actuelle

### 2.1 Créer un point de restauration Git

```bash
# Créer une branche de sauvegarde avec la date actuelle
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git push origin backup-$(date +%Y%m%d-%H%M%S)

# Revenir sur la branche principale
git checkout main
```

### 2.2 Sauvegarder la base de données

```bash
# Sauvegarder la base de données PostgreSQL
pg_dump -U postgres -d stock_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou si vous avez un nom d'utilisateur spécifique
pg_dump -U votre_user -d votre_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que la sauvegarde a été créée
ls -lh backup_*.sql
```

### 2.3 Sauvegarder le fichier .env

```bash
# Sauvegarder les variables d'environnement
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### 2.4 Sauvegarder les fichiers uploadés (si applicable)

```bash
# Si vous avez des fichiers uploadés (logos, etc.)
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads/
```

---

## 📥 Étape 3: Récupérer les Mises à Jour depuis Git

### 3.1 Vérifier l'état actuel

```bash
# Voir les modifications locales
git status

# Voir les branches distantes
git fetch origin
git branch -a
```

### 3.2 Stash les modifications locales (si nécessaire)

```bash
# Si vous avez des modifications locales non commitées
git stash save "Sauvegarde avant mise à jour $(date +%Y%m%d)"
```

### 3.3 Pull les dernières modifications

```bash
# Récupérer et fusionner les dernières modifications
git pull origin main

# Ou si vous préférez voir les changements d'abord
git fetch origin
git log HEAD..origin/main --oneline
git merge origin/main
```

---

## ⚙️ Étape 4: Mettre à Jour les Dépendances

### 4.1 Installer les nouvelles dépendances

```bash
# Installer toutes les dépendances (nouvelles et mises à jour)
npm install

# Vérifier les nouvelles dépendances installées
npm list --depth=0
```

**Nouvelles dépendances importantes dans cette mise à jour:**
- `jsonwebtoken` - Pour l'authentification JWT
- `@types/jsonwebtoken` - Types TypeScript pour JWT

### 4.2 Régénérer le client Prisma

```bash
# Régénérer le client Prisma après mise à jour
npx prisma generate
```

---

## 🗄️ Étape 5: Mettre à Jour la Base de Données

### 5.1 Vérifier les migrations nécessaires

```bash
# Vérifier l'état des migrations
npx prisma migrate status
```

### 5.2 Appliquer les migrations (si nécessaire)

```bash
# Si des migrations sont en attente
npx prisma migrate deploy

# OU si vous utilisez db:push
npx prisma db push
```

**Note:** En production, utilisez `migrate deploy` plutôt que `migrate dev`.

---

## 🔑 Étape 6: Configurer les Nouvelles Variables d'Environnement

### 6.1 Vérifier le fichier .env

```bash
# Éditer le fichier .env
nano .env
# ou
vi .env
```

### 6.2 Ajouter les Nouvelles Variables Requises

**IMPORTANT:** Ajoutez ces nouvelles variables pour l'authentification JWT:

```env
# Secrets JWT (OBLIGATOIRES pour la sécurité)
# Générez des secrets sécurisés avec:
# openssl rand -base64 32

JWT_SECRET="votre-secret-jwt-minimum-32-caracteres-genere-aleatoirement"
JWT_REFRESH_SECRET="votre-refresh-secret-jwt-minimum-32-caracteres-genere-aleatoirement"
```

**Pour générer des secrets sécurisés:**

```bash
# Sur le serveur, générer les secrets
openssl rand -base64 32
# Copiez la sortie et utilisez-la pour JWT_SECRET

openssl rand -base64 32
# Copiez la sortie et utilisez-la pour JWT_REFRESH_SECRET
```

### 6.3 Vérifier les Autres Variables

Assurez-vous que toutes les variables suivantes sont présentes:

```env
# Base de données (obligatoire)
DATABASE_URL="postgresql://user:password@localhost:5432/stock_management?schema=public"

# Environnement (production)
NODE_ENV="production"

# URL de l'API (si configurée)
NEXT_PUBLIC_API_URL="https://votre-domaine.com"

# Optionnel - Autres variables SMTP, etc.
```

### 6.4 Vérifier les Permissions du Fichier .env

```bash
# S'assurer que .env n'est pas accessible publiquement
chmod 600 .env
```

---

## 🏗️ Étape 7: Build de l'Application

### 7.1 Nettoyer le Build Précédent

```bash
# Supprimer le cache Next.js
rm -rf .next

# Optionnel: Nettoyer node_modules et réinstaller
# rm -rf node_modules package-lock.json
# npm install
```

### 7.2 Construire l'Application

```bash
# Build de production
npm run build

# Vérifier que le build s'est bien passé
ls -la .next/
```

**Attendez-vous à ce que le build prenne quelques minutes.**

---

## 🛑 Étape 8: Arrêter l'Application Actuelle

### 8.1 Si vous utilisez PM2

```bash
# Arrêter l'application
pm2 stop gestion-stock-smt-V2

# Ou arrêter tous les processus PM2
pm2 stop all

# Vérifier l'état
pm2 status
```

### 8.2 Si vous utilisez un Service Systemd

```bash
# Arrêter le service
sudo systemctl stop gestion-stock-smt

# Vérifier l'état
sudo systemctl status gestion-stock-smt
```

### 8.3 Si vous utilisez directement Node.js

```bash
# Trouver le processus
ps aux | grep node

# Arrêter le processus (remplacez PID par le numéro de processus)
kill -SIGTERM PID

# Ou utiliser killall
killall node
```

---

## ▶️ Étape 9: Redémarrer l'Application

### 9.1 Avec PM2

```bash
# Redémarrer l'application
pm2 restart gestion-stock-smt-V2

# Ou si c'est la première fois
pm2 start npm --name "gestion-stock-smt-V2" -- start

# Sauvegarder la configuration PM2
pm2 save

# Activer le démarrage automatique (si pas déjà fait)
pm2 startup
```

### 9.2 Avec Systemd

```bash
# Redémarrer le service
sudo systemctl restart gestion-stock-smt

# Vérifier qu'il démarre bien
sudo systemctl status gestion-stock-smt
```

### 9.3 Avec Node.js Directement

```bash
# Démarrer en production
npm start

# Ou avec PM2 pour la première fois
pm2 start npm --name "gestion-stock-smt-V2" -- start
```

---

## ✅ Étape 10: Vérification et Tests

### 10.1 Vérifier les Logs

```bash
# Avec PM2
pm2 logs gestion-stock-smt-V2 --lines 50

# Avec Systemd
sudo journalctl -u gestion-stock-smt -f

# Vérifier qu'il n'y a pas d'erreurs
pm2 logs gestion-stock-smt-V2 | grep -i error
```

### 10.2 Vérifier que l'Application Répond

```bash
# Tester la page d'accueil
curl http://localhost:3000

# Tester l'API de santé (si disponible)
curl http://localhost:3000/api/health

# Vérifier le port d'écoute
netstat -tulpn | grep 3000
# ou
ss -tulpn | grep 3000
```

### 10.3 Tester l'Authentification JWT

```bash
# Tester le login (remplacez les credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monetique.tn","password":"votre-mot-de-passe"}'

# Si cela retourne un token, l'authentification JWT fonctionne
```

### 10.4 Vérifier les Variables d'Environnement

```bash
# Vérifier que les nouvelles variables sont chargées
# (remplacez gestion-stock-smt-V2 par le nom de votre processus PM2)
pm2 env gestion-stock-smt-V2 | grep JWT
```

---

## 🔄 Étape 11: Tests Fonctionnels

### 11.1 Tests Basiques

1. **Se connecter à l'application**
   - Accéder à `https://votre-domaine.com/login`
   - Se connecter avec un compte admin
   - Vérifier que la connexion fonctionne

2. **Vérifier les fonctionnalités principales**
   - Accéder au dashboard
   - Vérifier les listes (banques, cartes, emplacements)
   - Vérifier les mouvements
   - Vérifier les statistiques

3. **Tester les nouvelles fonctionnalités**
   - Vérifier que l'authentification JWT fonctionne
   - Tester le rafraîchissement de token
   - Vérifier que les routes protégées nécessitent authentification

### 11.2 Tests de Sécurité

```bash
# Tester qu'une route protégée sans token retourne 401
curl http://localhost:3000/api/users

# Devrait retourner: {"success":false,"error":"Authentification requise..."}
```

---

## 🐛 Étape 12: Résolution de Problèmes

### Problème: Build échoue

```bash
# Vérifier les logs d'erreur
npm run build 2>&1 | tee build.log

# Solutions courantes:
# - Vérifier que toutes les dépendances sont installées: npm install
# - Vérifier les variables d'environnement: cat .env
# - Nettoyer et rebuilder: rm -rf .next node_modules && npm install && npm run build
```

### Problème: Application ne démarre pas

```bash
# Vérifier les logs
pm2 logs gestion-stock-smt-V2 --err

# Vérifier les variables d'environnement
pm2 env gestion-stock-smt-V2

# Vérifier que le port n'est pas déjà utilisé
netstat -tulpn | grep 3000
```

### Problème: Erreurs de base de données

```bash
# Vérifier la connexion à la base de données
psql -U postgres -d stock_management -c "SELECT 1;"

# Vérifier les migrations
npx prisma migrate status

# Appliquer les migrations manquantes
npx prisma migrate deploy
```

### Problème: Erreurs JWT

```bash
# Vérifier que JWT_SECRET et JWT_REFRESH_SECRET sont définis
grep JWT_SECRET .env

# Vérifier que les secrets ont au moins 32 caractères
# Regénérer si nécessaire
openssl rand -base64 32
```

---

## 🔙 Étape 13: Rollback (En cas de Problème)

Si vous devez revenir à la version précédente:

### 13.1 Rollback Git

```bash
# Revenir à la version précédente
git log --oneline -10  # Voir les commits récents
git checkout <commit-hash-de-la-version-precedente>

# Ou revenir à la branche de backup
git checkout backup-YYYYMMDD-HHMMSS
```

### 13.2 Restaurer la Base de Données

```bash
# Restaurer depuis la sauvegarde
psql -U postgres -d stock_management < backup_YYYYMMDD_HHMMSS.sql
```

### 13.3 Restaurer .env

```bash
# Restaurer les variables d'environnement
cp .env.backup.YYYYMMDD_HHMMSS .env
```

### 13.4 Rebuild et Redémarrage

```bash
# Rebuild
npm run build

# Redémarrer
pm2 restart gestion-stock-smt-V2
```

---

## 📋 Checklist de Déploiement

- [ ] Sauvegarde de la base de données effectuée
- [ ] Fichier .env sauvegardé
- [ ] Point de restauration Git créé
- [ ] Git pull effectué avec succès
- [ ] Dépendances npm installées
- [ ] Client Prisma régénéré
- [ ] Migrations de base de données appliquées (si nécessaire)
- [ ] Nouvelles variables d'environnement (JWT_SECRET, JWT_REFRESH_SECRET) ajoutées
- [ ] Build de production réussi
- [ ] Application arrêtée proprement
- [ ] Application redémarrée
- [ ] Logs vérifiés sans erreurs critiques
- [ ] Tests de connexion réussis
- [ ] Tests fonctionnels passés
- [ ] Tests de sécurité effectués

---

## 🔒 Sécurité Post-Déploiement

### Vérifications Importantes

1. **Vérifier que les secrets JWT sont bien configurés**
   ```bash
   pm2 env gestion-stock-smt-V2 | grep JWT
   ```

2. **Vérifier les permissions des fichiers**
   ```bash
   ls -la .env
   # Devrait être 600 (rw-------)
   ```

3. **Vérifier que le firewall est configuré**
   ```bash
   sudo firewall-cmd --list-all
   ```

4. **Vérifier les logs pour détecter les tentatives d'intrusion**
   ```bash
   pm2 logs gestion-stock-smt-V2 | grep -i "401\|unauthorized"
   ```

---

## 📞 Support et Documentation

### Fichiers de Documentation

- `SECURITY_IMPROVEMENTS.md` - Détails des améliorations de sécurité
- `CODE_REVIEW_RESULTS.md` - Résultats de la vérification du code
- `AUDIT_REPORT.md` - Rapport d'audit complet

### Commandes Utiles pour le Monitoring

```bash
# Voir les logs en temps réel
pm2 logs gestion-stock-smt-V2 --lines 100

# Voir les métriques
pm2 monit

# Redémarrer en cas de problème
pm2 restart gestion-stock-smt-V2

# Voir l'utilisation des ressources
pm2 status
```

---

## ✅ Conclusion

Après avoir suivi toutes ces étapes, votre application devrait être mise à jour avec toutes les nouvelles améliorations de sécurité, notamment:

- ✅ Authentification JWT
- ✅ Rate limiting
- ✅ Logging centralisé
- ✅ Middleware de protection

**Important:** N'oubliez pas de configurer les secrets JWT (`JWT_SECRET` et `JWT_REFRESH_SECRET`) avant de redémarrer l'application, sinon l'authentification ne fonctionnera pas.

---

**Date de création:** 20 janvier 2026  
**Version de l'application:** Après améliorations de sécurité

