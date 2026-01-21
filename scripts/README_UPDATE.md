# 📋 Guide de Mise à Jour

Script de mise à jour pour l'application Gestion Stock SMT V2.

---

## 🚀 Utilisation Rapide

### Sur le serveur RedHat (172.17.5.199)

```bash
# 1. Se connecter au serveur
ssh user@172.17.5.199

# 2. Aller dans le répertoire de l'application
cd /var/www/stock-management

# 3. Lancer la mise à jour
./scripts/update.sh
```

---

## ✅ Ce que fait le script

1. **Sauvegarde la configuration** (`.env.production`)
2. **Arrête l'application** PM2 proprement
3. **Met à jour le code** depuis Git (pull origin main)
4. **Met à jour les dépendances** npm
5. **Vérifie la configuration** (génère JWT secrets si manquants)
6. **Met à jour Prisma** (génère le client)
7. **Met à jour l'utilisateur admin** (email et mot de passe)
8. **Build l'application** (production)
9. **Redémarre l'application** avec PM2
10. **Vérifie que tout fonctionne**

---

## 🔧 Configuration

Le script utilise automatiquement ces valeurs :

- **Email admin**: `mohamed.boujelbane@monetiquetunisie.com`
- **Mot de passe admin**: `SMT@2025`
- **Application PM2**: `stock-management`
- **Répertoire**: `/var/www/stock-management`
- **IP serveur**: `172.17.5.199`

---

## ⚙️ Options Interactives

Le script demande confirmation pour :

1. **Synchroniser le schéma Prisma** (optionnel)
   - Saisissez `o` pour synchroniser
   - Saisissez `n` ou `Entrée` pour ignorer

2. **Mettre à jour l'utilisateur admin** (par défaut: oui)
   - Saisissez `y` ou `Entrée` pour mettre à jour
   - Saisissez `n` pour ignorer

---

## 📝 Exemple d'exécution

```
🔄 Mise à jour - Gestion Stock SMT V2
════════════════════════════════════════════════

Étape 1: Vérification de l'environnement...
✓ Application trouvée dans PM2
✓ Application en cours d'exécution

Étape 2: Sauvegarde de la configuration...
✓ Configuration sauvegardée: .env.production.backup.20250120_143022

Étape 3: Arrêt de l'application...
✓ Arrêt de l'application...

Étape 4: Mise à jour depuis Git...
✓ Mise à jour disponible - application des modifications...
✓ Code source mis à jour

Étape 5: Mise à jour des dépendances...
✓ Dépendances mises à jour

...

✅ Mise à jour terminée!
```

---

## 🔍 Vérification après mise à jour

```bash
# Vérifier le statut PM2
pm2 status

# Voir les logs
pm2 logs stock-management

# Tester localement
curl http://localhost:3000

# Vérifier que l'application répond
curl -I http://localhost:3000
```

---

## ⚠️ En cas d'erreur

### Build échoue

```bash
# Voir les erreurs de build
npm run build

# Vérifier les logs
pm2 logs stock-management --err
```

### Application ne démarre pas

```bash
# Voir les logs détaillés
pm2 logs stock-management --lines 50

# Redémarrer manuellement
pm2 restart stock-management
```

### Conflits Git

Si le script détecte des conflits :

```bash
# Résoudre les conflits manuellement
git status
git diff

# Après résolution, relancer le script
./scripts/update.sh
```

---

## 🔄 Restaurer une sauvegarde

Si quelque chose ne va pas, vous pouvez restaurer :

```bash
# Restaurer la configuration
cp .env.production.backup.20250120_143022 .env.production

# Restaurer le code depuis Git
git reset --hard HEAD~1

# Redémarrer
pm2 restart stock-management
```

---

## 📞 Support

En cas de problème, vérifiez :

1. Les logs PM2 : `pm2 logs stock-management`
2. Les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
3. La configuration : `.env.production`
4. Le statut PM2 : `pm2 status`

---

**Le script est sécurisé et préserve vos données existantes !**

