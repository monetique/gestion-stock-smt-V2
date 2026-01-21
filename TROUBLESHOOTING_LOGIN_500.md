# 🔐 Résolution Erreur 500 sur /api/auth/login

Guide spécifique pour résoudre l'erreur 500 lors de la connexion.

---

## 🚨 Cause la Plus Probable: Secrets JWT Manquants

L'erreur 500 sur `/api/auth/login` est **très probablement** due aux secrets JWT non configurés.

---

## ✅ Solution Rapide

### Étape 1: Vérifier les logs pour confirmer

```bash
# Sur le serveur RedHat, aller dans le répertoire de l'application
cd /chemin/vers/stock-managment

# Voir les logs de l'application
pm2 logs stock-managment --lines 50

# Ou filtrer les erreurs
pm2 logs stock-managment --err --lines 30
```

**Cherchez des erreurs comme:**
- `JWT_SECRET is not defined`
- `Cannot read property 'sign' of undefined`
- `Error in signAccessToken`

---

### Étape 2: Vérifier les secrets JWT dans .env.production

```bash
# Vérifier si JWT_SECRET existe
grep JWT_SECRET .env.production

# Vérifier si JWT_REFRESH_SECRET existe
grep JWT_REFRESH_SECRET .env.production

# Si rien n'apparaît, ils sont manquants!
```

---

### Étape 3: Ajouter les secrets JWT

```bash
# Générer et ajouter JWT_SECRET
echo 'JWT_SECRET="'$(openssl rand -base64 32)'"' >> .env.production

# Générer et ajouter JWT_REFRESH_SECRET
echo 'JWT_REFRESH_SECRET="'$(openssl rand -base64 32)'"' >> .env.production

# Vérifier que c'est bien ajouté
cat .env.production | grep JWT
```

**Important:** Les secrets doivent être sur une seule ligne chacun:
```env
JWT_SECRET="abc123..."
JWT_REFRESH_SECRET="xyz789..."
```

---

### Étape 4: Vérifier NODE_ENV

```bash
# Vérifier que NODE_ENV est bien "production"
grep NODE_ENV .env.production

# Si absent ou différent, corriger
grep -q 'NODE_ENV="production"' .env.production || echo 'NODE_ENV="production"' >> .env.production
```

---

### Étape 5: Redémarrer l'application

```bash
# Redémarrer pour charger les nouvelles variables
pm2 restart stock-managment

# Attendre quelques secondes
sleep 3

# Vérifier les logs
pm2 logs stock-managment --lines 20
```

---

### Étape 6: Tester le login

```bash
# Tester avec curl (remplacer les credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monetique.tn","password":"votre-mot-de-passe"}'

# Si ça retourne un token, c'est bon!
```

---

## 🔍 Autres Causes Possibles

### Cause 2: Erreur de Base de Données

**Vérifier:**

```bash
# Tester la connexion à la base
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"

# Vérifier DATABASE_URL
grep DATABASE_URL .env.production | sed 's/:[^:]*@/:****@/g'
```

**Si erreur, corriger DATABASE_URL dans .env.production**

---

### Cause 3: Utilisateur Non Trouvé ou Mot de Passe Incorrect

**Vérifier dans les logs:**

```bash
pm2 logs stock-managment | grep -i "user not found\|invalid password\|incorrect"
```

**Si c'est le cas:**
- Vérifier que l'utilisateur existe dans la base de données
- Vérifier que le mot de passe est correct
- Tester avec un autre compte

---

### Cause 4: Module bcryptjs Non Installé

**Vérifier:**

```bash
# Vérifier si bcryptjs est installé
npm list bcryptjs

# Si absent, installer
npm install bcryptjs @types/bcryptjs
npm run build
pm2 restart stock-managment
```

---

### Cause 5: Erreur dans le Code du Login

**Vérifier les logs détaillés:**

```bash
# Voir toutes les erreurs
pm2 logs stock-managment --lines 100 | grep -i error

# Voir la stack trace complète
pm2 logs stock-managment --lines 200 | grep -A 10 "Error:"
```

---

## 📋 Checklist de Diagnostic Complète

Exécutez cette séquence complète:

```bash
cd /chemin/vers/stock-managment

echo "=== 1. Vérification secrets JWT ==="
grep JWT_SECRET .env.production || echo "❌ JWT_SECRET manquant"
grep JWT_REFRESH_SECRET .env.production || echo "❌ JWT_REFRESH_SECRET manquant"

echo ""
echo "=== 2. Vérification NODE_ENV ==="
grep NODE_ENV .env.production || echo "❌ NODE_ENV manquant"

echo ""
echo "=== 3. Vérification DATABASE_URL ==="
grep DATABASE_URL .env.production | sed 's/:[^:]*@/:****@/g' || echo "❌ DATABASE_URL manquant"

echo ""
echo "=== 4. Test connexion base de données ==="
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | head -3

echo ""
echo "=== 5. Vérification utilisateur dans DB ==="
npx prisma db execute --stdin <<< "SELECT email FROM users LIMIT 5;" 2>&1 | head -10

echo ""
echo "=== 6. Logs récents ==="
pm2 logs stock-managment --lines 10 --nostream
```

---

## 🛠️ Solution Complète Rapide

**Copiez-collez cette séquence complète:**

```bash
cd /chemin/vers/stock-managment

# 1. Générer et ajouter les secrets JWT
if ! grep -q JWT_SECRET .env.production; then
    echo "Ajout de JWT_SECRET..."
    echo 'JWT_SECRET="'$(openssl rand -base64 32)'"' >> .env.production
fi

if ! grep -q JWT_REFRESH_SECRET .env.production; then
    echo "Ajout de JWT_REFRESH_SECRET..."
    echo 'JWT_REFRESH_SECRET="'$(openssl rand -base64 32)'"' >> .env.production
fi

# 2. Vérifier NODE_ENV
grep -q 'NODE_ENV="production"' .env.production || echo 'NODE_ENV="production"' >> .env.production

# 3. Vérifier les permissions
chmod 600 .env.production

# 4. Redémarrer
pm2 restart stock-managment

# 5. Attendre et vérifier
sleep 5
pm2 logs stock-managment --lines 20
```

---

## ✅ Test Final

```bash
# Tester le login
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monetique.tn","password":"votre-mot-de-passe"}'

# Réponse attendue si OK:
# {"success":true,"data":{"user":{...},"accessToken":"...","refreshToken":"..."}}
```

---

## 🔙 Si Rien Ne Fonctionne

### Voir l'erreur exacte dans les logs

```bash
# Arrêter l'application
pm2 stop stock-managment

# Démarrer en mode debug pour voir toutes les erreurs
NODE_ENV=production npm start

# Faire une tentative de login depuis le navigateur
# Voir l'erreur complète dans le terminal
```

---

**Commencez par vérifier et ajouter les secrets JWT - c'est la cause la plus probable de l'erreur 500 sur /api/auth/login !**

