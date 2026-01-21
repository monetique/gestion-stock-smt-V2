# 🔧 Résolution Erreur 500 Internal Server Error - Après Mise à Jour

Guide de dépannage pour résoudre l'erreur 500 après la mise à jour sur RedHat.

---

## 🔍 Étape 1: Vérifier les Logs

**La première chose à faire est de consulter les logs pour identifier l'erreur exacte.**

### Avec PM2

```bash
# Voir les logs en temps réel
pm2 logs gestion-stock-smt-V2 --lines 100

# Voir uniquement les erreurs
pm2 logs gestion-stock-smt-V2 --err --lines 50

# Voir les logs de la dernière heure
pm2 logs gestion-stock-smt-V2 --lines 500 | grep -i error
```

### Avec Systemd

```bash
# Voir les logs du service
sudo journalctl -u gestion-stock-smt -n 100

# Voir les logs en temps réel
sudo journalctl -u gestion-stock-smt -f

# Filtrer les erreurs
sudo journalctl -u gestion-stock-smt | grep -i error
```

---

## 🚨 Causes Courantes et Solutions

### Cause 1: Secrets JWT Non Configurés ⚠️ (LE PLUS PROBABLE)

**Symptôme:** Erreur dans les logs mentionnant JWT_SECRET ou JWT_REFRESH_SECRET

**Solution:**

```bash
# 1. Vérifier que les secrets sont dans .env
grep JWT_SECRET .env
grep JWT_REFRESH_SECRET .env

# 2. Si absents, générer et ajouter
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 32  # Pour JWT_REFRESH_SECRET

# 3. Éditer .env
nano .env

# Ajouter:
# JWT_SECRET="votre-secret-genere"
# JWT_REFRESH_SECRET="votre-refresh-secret-genere"

# 4. Vérifier les permissions
chmod 600 .env

# 5. Redémarrer l'application
pm2 restart gestion-stock-smt-V2

# 6. Vérifier que les variables sont chargées
pm2 env gestion-stock-smt-V2 | grep JWT
```

---

### Cause 2: Erreur de Build ou Fichiers Manquants

**Symptôme:** Erreur mentionnant des modules manquants ou fichiers non trouvés

**Solution:**

```bash
# 1. Vérifier que .next existe
ls -la .next/

# 2. Si absent ou corrompu, rebuilder
rm -rf .next
npm run build

# 3. Vérifier que le build a réussi
ls -la .next/standalone 2>/dev/null || echo "Build standard"
ls -la .next/server 2>/dev/null || echo "Vérifier .next/server"

# 4. Redémarrer
pm2 restart gestion-stock-smt-V2
```

---

### Cause 3: Dépendances Manquantes

**Symptôme:** Erreur "Cannot find module" ou "Module not found"

**Solution:**

```bash
# 1. Réinstaller toutes les dépendances
rm -rf node_modules package-lock.json
npm install

# 2. Vérifier que jsonwebtoken est installé
npm list jsonwebtoken

# 3. Si absent, installer explicitement
npm install jsonwebtoken @types/jsonwebtoken

# 4. Régénérer Prisma
npx prisma generate

# 5. Rebuild
npm run build

# 6. Redémarrer
pm2 restart gestion-stock-smt-V2
```

---

### Cause 4: Erreur de Connexion Base de Données

**Symptôme:** Erreur Prisma ou "Can't reach database server"

**Solution:**

```bash
# 1. Vérifier la connexion PostgreSQL
psql -U postgres -d stock_management -c "SELECT 1;"

# 2. Vérifier DATABASE_URL dans .env
grep DATABASE_URL .env

# 3. Tester la connexion avec Prisma
npx prisma db execute --stdin <<< "SELECT 1;"

# 4. Si erreur, vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# 5. Si arrêté, démarrer
sudo systemctl start postgresql
```

---

### Cause 5: Erreur de Validation des Variables d'Environnement

**Symptôme:** Erreur "Variables d'environnement invalides" au démarrage

**Solution:**

```bash
# 1. Vérifier que toutes les variables requises sont présentes
cat .env

# 2. Vérifier le format (pas d'espaces autour du =)
# CORRECT: DATABASE_URL="postgresql://..."
# INCORRECT: DATABASE_URL = "postgresql://..."

# 3. Vérifier que NODE_ENV est défini
grep NODE_ENV .env
# Devrait être: NODE_ENV="production"

# 4. Vérifier les secrets JWT (minimum 32 caractères)
if grep JWT_SECRET .env; then
    JWT_LENGTH=$(grep JWT_SECRET .env | cut -d'=' -f2 | tr -d '"' | wc -c)
    if [ $JWT_LENGTH -lt 32 ]; then
        echo "⚠️ JWT_SECRET trop court (minimum 32 caractères)"
    fi
fi
```

---

### Cause 6: Port Déjà Utilisé

**Symptôme:** Erreur "Port 3000 already in use" ou "EADDRINUSE"

**Solution:**

```bash
# 1. Vérifier quel processus utilise le port
sudo netstat -tulpn | grep 3000
# ou
sudo ss -tulpn | grep 3000

# 2. Trouver le processus
sudo lsof -i :3000

# 3. Si c'est un ancien processus Node, l'arrêter
pm2 list
pm2 stop all
pm2 delete all

# 4. Redémarrer proprement
pm2 start npm --name "gestion-stock-smt-V2" -- start
pm2 save
```

---

### Cause 7: Problème avec le Middleware

**Symptôme:** Erreur dans les logs mentionnant "middleware" ou "verifyAccessToken"

**Solution:**

```bash
# 1. Vérifier que app/middleware.ts existe
ls -la app/middleware.ts

# 2. Vérifier le contenu (syntaxe correcte)
node -c app/middleware.ts 2>&1 || echo "Erreur de syntaxe"

# 3. Vérifier que lib/auth.ts existe et est correct
ls -la lib/auth.ts

# 4. Si problème, vérifier les imports
grep -r "from.*@/lib/auth" app/
grep -r "from.*@/lib/logger" app/
```

---

## 🔍 Diagnostic Complet - Script de Vérification

Exécutez ces commandes pour un diagnostic complet:

```bash
# 1. Vérifier que l'application est démarrée
pm2 status

# 2. Voir les dernières erreurs
pm2 logs gestion-stock-smt-V2 --err --lines 20

# 3. Vérifier les variables d'environnement
pm2 env gestion-stock-smt-V2 | grep -E "JWT|DATABASE|NODE_ENV"

# 4. Vérifier les fichiers essentiels
echo "=== Vérification fichiers ==="
ls -la app/middleware.ts lib/auth.ts lib/logger.ts 2>/dev/null || echo "Fichiers manquants!"

# 5. Vérifier le build
echo "=== Vérification build ==="
ls -la .next/ 2>/dev/null || echo "⚠️ Dossier .next manquant - rebuild nécessaire"

# 6. Vérifier Prisma
echo "=== Vérification Prisma ==="
npx prisma generate 2>&1 | tail -5

# 7. Test connexion DB
echo "=== Test Base de Données ==="
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | head -5

# 8. Vérifier le port
echo "=== Vérification port ==="
netstat -tulpn | grep 3000 || echo "Aucun processus sur le port 3000"
```

---

## 🛠️ Solution Rapide - Redémarrage Complet

Si vous ne trouvez pas la cause exacte, essayez un redémarrage complet:

```bash
# 1. Arrêter l'application
pm2 stop gestion-stock-smt-V2
pm2 delete gestion-stock-smt-V2

# 2. Vérifier et configurer les variables JWT (si absentes)
if ! grep -q JWT_SECRET .env; then
    echo "⚠️ Configuration des secrets JWT..."
    echo "JWT_SECRET=\"$(openssl rand -base64 32)\"" >> .env
    echo "JWT_REFRESH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
fi

# 3. Vérifier NODE_ENV
if ! grep -q "NODE_ENV" .env; then
    echo "NODE_ENV=\"production\"" >> .env
fi

# 4. Réinstaller dépendances (si nécessaire)
npm install

# 5. Régénérer Prisma
npx prisma generate

# 6. Rebuild
rm -rf .next
npm run build

# 7. Redémarrer
pm2 start npm --name "gestion-stock-smt-V2" -- start
pm2 save

# 8. Voir les logs
sleep 3
pm2 logs gestion-stock-smt-V2 --lines 30
```

---

## 📋 Checklist de Vérification

- [ ] Logs vérifiés - Quelle est l'erreur exacte ?
- [ ] JWT_SECRET et JWT_REFRESH_SECRET présents dans .env
- [ ] DATABASE_URL correct dans .env
- [ ] NODE_ENV="production" dans .env
- [ ] PostgreSQL démarré et accessible
- [ ] Dépendances npm installées (npm install)
- [ ] Prisma client régénéré (npx prisma generate)
- [ ] Build réussi (.next/ existe)
- [ ] Port 3000 disponible
- [ ] Application redémarrée après modifications

---

## 🔙 Rollback si Nécessaire

Si rien ne fonctionne, revenir à la version précédente:

```bash
# 1. Arrêter l'application
pm2 stop gestion-stock-smt-V2

# 2. Revenir à la version précédente Git
git log --oneline -5  # Voir les commits
git checkout <commit-hash-precedent>

# 3. Restaurer .env si modifié
cp .env.backup.* .env

# 4. Reinstaller et rebuild
npm install
npm run build

# 5. Redémarrer
pm2 restart gestion-stock-smt-V2
```

---

## 📞 Informations à Collecter pour Diagnostic

Si le problème persiste, collectez ces informations:

```bash
# 1. Les logs d'erreur
pm2 logs gestion-stock-smt-V2 --err --lines 100 > error_logs.txt

# 2. La version de Node.js
node --version > node_version.txt

# 3. Les variables d'environnement (masquer les valeurs sensibles)
env | grep -E "JWT|DATABASE|NODE" | sed 's/=.*/=***/' > env_vars.txt

# 4. Le statut PM2
pm2 status > pm2_status.txt

# 5. Les fichiers de configuration
ls -la .env app/middleware.ts lib/auth.ts > files_check.txt
```

---

## ✅ Test Rapide Après Correction

```bash
# 1. Vérifier que l'application démarre
pm2 status

# 2. Tester une requête simple
curl http://localhost:3000

# 3. Tester le login (remplacer credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monetique.tn","password":"votre-password"}'

# 4. Vérifier les logs pour erreurs
pm2 logs gestion-stock-smt-V2 --lines 10
```

---

**Commencez par vérifier les logs avec `pm2 logs gestion-stock-smt-V2 --lines 100` pour identifier l'erreur exacte !**

