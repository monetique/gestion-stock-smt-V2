# 🔧 Résolution Erreur 502 Bad Gateway

L'erreur 502 Bad Gateway signifie que Nginx ne peut pas se connecter à l'application Next.js.

---

## 🔍 Diagnostic Immédiat

### Étape 1: Vérifier que l'application tourne

```bash
# Vérifier avec PM2
pm2 status

# Vérifier les processus Node.js
ps aux | grep node

# Vérifier le port 3000 (ou le port configuré)
sudo netstat -tulpn | grep 3000
# ou
sudo ss -tulpn | grep 3000

# Tester localement
curl http://localhost:3000
```

**Si rien ne répond sur le port 3000, l'application n'est pas démarrée.**

---

### Étape 2: Vérifier les logs PM2

```bash
# Voir les logs récents
pm2 logs stock-management --lines 100

# Voir uniquement les erreurs
pm2 logs stock-management --err --lines 50
```

**Cherchez des erreurs qui empêchent l'application de démarrer.**

---

### Étape 3: Vérifier la configuration Nginx

```bash
# Voir la configuration Nginx
sudo cat /etc/nginx/sites-available/gstock.monetiquetunisie.com
# ou
sudo cat /etc/nginx/conf.d/gstock.conf

# Vérifier que Nginx pointe vers le bon port
# Cherchez: proxy_pass http://localhost:3000;
```

---

## ✅ Solutions

### Solution 1: Redémarrer l'application

```bash
cd /var/www/stock-management

# Vérifier le statut
pm2 status

# Si l'application n'est pas en ligne, la démarrer
pm2 start npm --name "stock-management" -- start

# Ou redémarrer si elle existe
pm2 restart stock-management

# Sauvegarder
pm2 save

# Vérifier les logs
pm2 logs stock-management --lines 30
```

---

### Solution 2: Vérifier que l'application écoute sur le bon port

```bash
# Vérifier que l'application écoute sur localhost:3000
curl http://localhost:3000

# Si ça ne répond pas, vérifier les logs
pm2 logs stock-management

# Vérifier le port dans les logs
pm2 logs stock-management | grep -i "Local\|port\|3000"
```

**L'application doit afficher quelque chose comme:**
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
✓ Ready in XXXms
```

---

### Solution 3: Vérifier la configuration Nginx

La configuration Nginx doit pointer vers `http://localhost:3000` (ou `127.0.0.1:3000`):

```nginx
server {
    listen 80;
    server_name gstock.monetiquetunisie.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Vérifier et corriger:**

```bash
# Éditer la configuration Nginx
sudo nano /etc/nginx/sites-available/gstock.monetiquetunisie.com
# ou
sudo nano /etc/nginx/conf.d/gstock.conf

# Vérifier que proxy_pass pointe vers http://localhost:3000
# Sauvegarder (Ctrl+X, puis Y, puis Enter)

# Tester la configuration
sudo nginx -t

# Si OK, recharger Nginx
sudo systemctl reload nginx
```

---

### Solution 4: Vérifier les logs Nginx

```bash
# Voir les logs d'erreur Nginx
sudo tail -f /var/log/nginx/error.log

# Voir les logs d'accès
sudo tail -f /var/log/nginx/access.log
```

**Cherchez des erreurs comme:**
- `connect() failed (111: Connection refused)`
- `upstream prematurely closed connection`

---

### Solution 5: Vérifier le firewall

```bash
# Vérifier que le port 3000 est accessible en local
sudo netstat -tulpn | grep 3000

# Vérifier le firewall (si configuré)
sudo firewall-cmd --list-all
# ou
sudo ufw status
```

**Le port 3000 n'a pas besoin d'être ouvert publiquement, seulement accessible par Nginx en local.**

---

## 🛠️ Script de Diagnostic Complet

```bash
#!/bin/bash

echo "=== Diagnostic 502 Bad Gateway ==="
echo ""

echo "1. Statut PM2:"
pm2 status

echo ""
echo "2. Processus Node.js:"
ps aux | grep -E "node|next" | grep -v grep

echo ""
echo "3. Port 3000:"
sudo netstat -tulpn | grep 3000 || echo "Aucun processus sur le port 3000"

echo ""
echo "4. Test local:"
curl -s http://localhost:3000 | head -20 || echo "❌ L'application ne répond pas sur localhost:3000"

echo ""
echo "5. Logs PM2 récents:"
pm2 logs stock-management --lines 20 --nostream

echo ""
echo "6. Configuration Nginx:"
sudo grep -A 5 "proxy_pass" /etc/nginx/sites-enabled/* 2>/dev/null | head -10 || \
sudo grep -A 5 "proxy_pass" /etc/nginx/conf.d/*.conf 2>/dev/null | head -10

echo ""
echo "7. Logs Nginx récents:"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "Logs Nginx non accessibles"
```

---

## ✅ Solution Rapide - Redémarrage Complet

```bash
cd /var/www/stock-management

# 1. Arrêter tout
pm2 stop all
pm2 delete all

# 2. Tuer les processus zombie
sudo pkill -f node 2>/dev/null || true

# 3. Libérer le port 3000
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# 4. Démarrer l'application
pm2 start npm --name "stock-management" -- start
pm2 save

# 5. Attendre le démarrage
sleep 5

# 6. Vérifier que ça fonctionne localement
curl http://localhost:3000

# 7. Si ça fonctionne, recharger Nginx
sudo systemctl reload nginx

# 8. Vérifier les logs
pm2 logs stock-management --lines 20
```

---

## 🔍 Vérifications Spécifiques

### Vérifier que l'application écoute sur 0.0.0.0 ou 127.0.0.1

Par défaut, Next.js écoute sur `localhost` (127.0.0.1), ce qui devrait fonctionner avec Nginx.

Si nécessaire, vous pouvez forcer l'écoute sur un host spécifique:

```bash
# Dans package.json, modifier le script start:
# "start": "next start -H 0.0.0.0 -p 3000"
```

Ou créer un fichier `.env.production`:
```env
HOSTNAME=0.0.0.0
PORT=3000
```

---

### Vérifier les erreurs de démarrage

```bash
# Voir tous les logs d'erreur
pm2 logs stock-management --err

# Chercher les erreurs spécifiques
pm2 logs stock-management | grep -i "error\|failed\|cannot"
```

**Erreurs courantes:**
- `Error: listen EADDRINUSE` → Port déjà utilisé
- `Cannot find module` → Dépendances manquantes
- `Database connection error` → Problème de connexion DB
- `JWT_SECRET missing` → Secrets manquants

---

## 📋 Checklist de Résolution

- [ ] Application démarrée dans PM2 (`pm2 status`)
- [ ] Application écoute sur le port 3000 (`netstat -tulpn | grep 3000`)
- [ ] Application répond localement (`curl http://localhost:3000`)
- [ ] Nginx configuré pour pointer vers `http://localhost:3000`
- [ ] Configuration Nginx testée (`sudo nginx -t`)
- [ ] Nginx rechargé (`sudo systemctl reload nginx`)
- [ ] Pas d'erreur dans les logs PM2
- [ ] Pas d'erreur dans les logs Nginx

---

## 🚨 Si Rien Ne Fonctionne

### Redémarrage complet du système de proxy

```bash
# Redémarrer Nginx
sudo systemctl restart nginx

# Redémarrer l'application
pm2 restart stock-management

# Vérifier les services
sudo systemctl status nginx
pm2 status
```

---

**Commencez par vérifier que l'application tourne avec `pm2 status` et `curl http://localhost:3000` !**

