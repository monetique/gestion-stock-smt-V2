# 📋 Guide de Tests Manuels - Application de Gestion de Stocks

Ce document décrit les tests manuels à effectuer pour valider toutes les fonctionnalités de l'application.

## 🔐 1. Tests d'Authentification

### 1.1 Connexion
- [ ] **Test 1.1.1** : Se connecter avec des identifiants valides
  - ✅ Vérifier que la redirection vers `/dashboard` fonctionne
  - ✅ Vérifier que les informations utilisateur sont affichées

- [ ] **Test 1.1.2** : Tentative de connexion avec email invalide
  - ✅ Vérifier l'affichage d'un message d'erreur approprié

- [ ] **Test 1.1.3** : Tentative de connexion avec mot de passe incorrect
  - ✅ Vérifier l'affichage d'un message d'erreur approprié

- [ ] **Test 1.1.4** : Connexion avec un compte désactivé
  - ✅ Vérifier que l'accès est refusé avec un message approprié

### 1.2 Déconnexion
- [ ] **Test 1.2.1** : Déconnexion depuis le menu
  - ✅ Vérifier que la session est terminée
  - ✅ Vérifier la redirection vers la page de login

---

## 🏦 2. Tests des Banques

### 2.1 Affichage
- [ ] **Test 2.1.1** : Accéder à `/dashboard/banks`
  - ✅ Vérifier l'affichage de la liste des banques
  - ✅ Vérifier la pagination si plus de 30 banques

- [ ] **Test 2.1.2** : Filtrer les banques par statut (actif/inactif)
  - ✅ Vérifier que les filtres fonctionnent correctement

- [ ] **Test 2.1.3** : Rechercher une banque par nom ou code
  - ✅ Vérifier que la recherche fonctionne en temps réel

### 2.2 Création
- [ ] **Test 2.2.1** : Créer une nouvelle banque avec tous les champs requis
  - ✅ Vérifier la validation des champs (nom, code, Swift code)
  - ✅ Vérifier que la banque apparaît dans la liste après création

- [ ] **Test 2.2.2** : Tentative de créer une banque avec un code existant
  - ✅ Vérifier l'affichage d'une erreur de duplication

- [ ] **Test 2.2.3** : Créer une banque avec un Swift code invalide
  - ✅ Vérifier la validation (8 ou 11 caractères)

### 2.3 Modification
- [ ] **Test 2.3.1** : Modifier les informations d'une banque existante
  - ✅ Vérifier que les modifications sont sauvegardées
  - ✅ Vérifier l'apparition dans les logs d'audit

### 2.4 Suppression
- [ ] **Test 2.4.1** : Désactiver une banque (soft delete)
  - ✅ Vérifier que la banque n'apparaît plus dans la liste active

- [ ] **Test 2.4.2** : Supprimer définitivement une banque
  - ✅ Vérifier la confirmation avant suppression
  - ✅ Vérifier que les cartes liées sont également supprimées (cascade)

### 2.5 Import CSV
- [ ] **Test 2.5.1** : Importer des banques via CSV
  - ✅ Vérifier le format attendu
  - ✅ Vérifier l'affichage des résultats (créées, mises à jour, rejetées)
  - ✅ Vérifier la gestion des erreurs de format

---

## 💳 3. Tests des Cartes

### 3.1 Affichage
- [ ] **Test 3.1.1** : Accéder à `/dashboard/cards`
  - ✅ Vérifier l'affichage de la liste des cartes avec leurs stocks

- [ ] **Test 3.1.2** : Filtrer par banque, type, sous-type
  - ✅ Vérifier que tous les filtres fonctionnent

- [ ] **Test 3.1.3** : Filtrer les cartes en stock faible
  - ✅ Vérifier que seules les cartes avec stock < seuil minimum sont affichées

### 3.2 Création
- [ ] **Test 3.2.1** : Créer une nouvelle carte avec tous les champs
  - ✅ Vérifier la validation des champs requis
  - ✅ Vérifier l'association avec une banque

- [ ] **Test 3.2.2** : Créer une carte avec des niveaux de stock par emplacement
  - ✅ Vérifier que les stocks sont correctement répartis

### 3.3 Modification
- [ ] **Test 3.3.1** : Modifier les seuils de stock d'une carte
  - ✅ Vérifier que les alertes sont recalculées

### 3.4 Stock
- [ ] **Test 3.4.1** : Vérifier l'affichage du stock total (somme par emplacement)
  - ✅ Vérifier la cohérence des calculs

---

## 📍 4. Tests des Emplacements

### 4.1 Affichage
- [ ] **Test 4.1.1** : Accéder à `/dashboard/locations`
  - ✅ Vérifier l'affichage de la liste des emplacements

- [ ] **Test 4.1.2** : Filtrer par banque
  - ✅ Vérifier que le filtre fonctionne

### 4.2 Création
- [ ] **Test 4.2.1** : Créer un nouvel emplacement
  - ✅ Vérifier l'association avec une banque

### 4.3 Impression
- [ ] **Test 4.3.1** : Imprimer le stock par banque
  - ✅ Vérifier que le logo de l'entreprise apparaît
  - ✅ Vérifier que les données sont correctes

- [ ] **Test 4.3.2** : Imprimer le stock par emplacement
  - ✅ Vérifier que le logo de l'entreprise apparaît
  - ✅ Vérifier que les données sont correctes

---

## 📦 5. Tests des Mouvements de Stock

### 5.1 Affichage
- [ ] **Test 5.1.1** : Accéder à `/dashboard/movements`
  - ✅ Vérifier l'affichage de l'historique des mouvements

- [ ] **Test 5.1.2** : Filtrer par banque, carte, type de mouvement, emplacements, dates
  - ✅ Vérifier que tous les filtres fonctionnent individuellement
  - ✅ Vérifier que les filtres peuvent être combinés

- [ ] **Test 5.1.3** : Pagination des mouvements
  - ✅ Vérifier que la pagination fonctionne correctement

### 5.2 Création de mouvement
- [ ] **Test 5.2.1** : Créer un mouvement d'entrée de stock
  - ✅ Vérifier que le stock de la carte augmente
  - ✅ Vérifier l'apparition dans l'historique

- [ ] **Test 5.2.2** : Créer un mouvement de sortie de stock
  - ✅ Vérifier que le stock de la carte diminue
  - ✅ Vérifier qu'on ne peut pas sortir plus que le stock disponible

- [ ] **Test 5.2.3** : Créer un mouvement de transfert entre emplacements
  - ✅ Vérifier que le stock est débité de l'emplacement source
  - ✅ Vérifier que le stock est crédité à l'emplacement destination

- [ ] **Test 5.2.4** : Créer un mouvement en lot (plusieurs cartes)
  - ✅ Vérifier que tous les mouvements sont créés
  - ✅ Vérifier que les stocks sont mis à jour pour chaque carte

### 5.3 Impression
- [ ] **Test 5.3.1** : Imprimer le bordereau de mouvement avec filtres appliqués
  - ✅ **CRITIQUE** : Vérifier que les statistiques respectent les filtres (banque, emplacement, date)
  - ✅ Vérifier que seules les données filtrées apparaissent dans les statistiques
  - ✅ Vérifier l'affichage des filtres actifs dans l'en-tête du bordereau

### 5.4 Statistiques dans le bordereau
- [ ] **Test 5.4.1** : Avec filtre "Emplacement De" sélectionné
  - ✅ Vérifier que les statistiques n'incluent que cet emplacement source

- [ ] **Test 5.4.2** : Avec filtre "Date" sélectionné
  - ✅ Vérifier que les statistiques n'incluent que cette date

- [ ] **Test 5.4.3** : Avec plusieurs filtres combinés
  - ✅ Vérifier que les statistiques respectent tous les filtres

---

## 👥 6. Tests des Utilisateurs

### 6.1 Affichage
- [ ] **Test 6.1.1** : Accéder à `/dashboard/users` (admin uniquement)
  - ✅ Vérifier que seuls les admins peuvent accéder
  - ✅ Vérifier l'affichage de la liste des utilisateurs

### 6.2 Création
- [ ] **Test 6.2.1** : Créer un nouvel utilisateur avec email
  - ✅ Vérifier l'envoi de l'email de bienvenue (si configuré)
  - ✅ Vérifier que le mot de passe temporaire est généré

- [ ] **Test 6.2.2** : Créer un utilisateur avec un email existant
  - ✅ Vérifier l'affichage d'une erreur de duplication

### 6.3 Modification
- [ ] **Test 6.3.1** : Modifier le rôle d'un utilisateur
  - ✅ Vérifier que les permissions sont mises à jour

- [ ] **Test 6.3.2** : Désactiver un utilisateur
  - ✅ Vérifier qu'il ne peut plus se connecter

### 6.4 Suppression
- [ ] **Test 6.4.1** : Supprimer un utilisateur
  - ✅ Vérifier la confirmation avant suppression
  - ✅ Vérifier l'apparition dans les logs d'audit

---

## 🎭 7. Tests des Rôles et Permissions

### 7.1 Permissions
- [ ] **Test 7.1.1** : Accéder aux pages avec un rôle utilisateur
  - ✅ Vérifier que l'accès aux pages admin est refusé

- [ ] **Test 7.1.2** : Accéder aux pages avec un rôle admin
  - ✅ Vérifier l'accès complet à toutes les fonctionnalités

---

## ⚙️ 8. Tests de Configuration

### 8.1 Configuration générale
- [ ] **Test 8.1.1** : Accéder à `/dashboard/config`
  - ✅ Vérifier l'affichage de la configuration actuelle

- [ ] **Test 8.1.2** : Modifier le nom de l'entreprise
  - ✅ Vérifier que le changement est sauvegardé

- [ ] **Test 8.1.3** : Uploader un logo
  - ✅ Vérifier que le logo apparaît dans les impressions

### 8.2 Configuration SMTP
- [ ] **Test 8.2.1** : Configurer les paramètres SMTP
  - ✅ Vérifier la sauvegarde des paramètres

- [ ] **Test 8.2.2** : Tester l'envoi d'email
  - ✅ Vérifier que l'email de test est reçu

### 8.3 Configuration des notifications
- [ ] **Test 8.3.1** : Activer/désactiver les notifications email
  - ✅ Vérifier que les notifications suivent la configuration

- [ ] **Test 8.3.2** : Configurer les destinataires des notifications
  - ✅ Vérifier que les emails sont envoyés aux bons destinataires

---

## 📧 9. Tests des Notifications Email

### 9.1 Email de bienvenue
- [ ] **Test 9.1.1** : Créer un utilisateur avec envoi d'email activé
  - ✅ Vérifier la réception de l'email de bienvenue
  - ✅ Vérifier que le mot de passe temporaire est inclus

### 9.2 Alertes de stock faible
- [ ] **Test 9.2.1** : Réduire le stock d'une carte en dessous du seuil
  - ✅ Vérifier l'envoi d'une alerte email (si configuré)

### 9.3 Notifications de mouvement
- [ ] **Test 9.3.1** : Créer un mouvement important
  - ✅ Vérifier l'envoi d'une notification (si configuré)

---

## 📊 10. Tests du Tableau de Bord

### 10.1 Statistiques
- [ ] **Test 10.1.1** : Accéder à `/dashboard`
  - ✅ Vérifier l'affichage des statistiques générales
  - ✅ Vérifier les graphiques et indicateurs

- [ ] **Test 10.1.2** : Vérifier la cohérence des statistiques
  - ✅ Vérifier que les totaux correspondent aux données réelles

---

## 📋 11. Tests des Logs d'Audit

### 11.1 Affichage
- [ ] **Test 11.1.1** : Accéder à `/dashboard/logs`
  - ✅ Vérifier l'affichage des logs d'audit

- [ ] **Test 11.1.2** : Filtrer par module, action, statut, dates
  - ✅ Vérifier que tous les filtres fonctionnent

- [ ] **Test 11.1.3** : Rechercher dans les logs
  - ✅ Vérifier que la recherche fonctionne

### 11.2 Enregistrement
- [ ] **Test 11.2.1** : Effectuer une action (créer, modifier, supprimer)
  - ✅ Vérifier que l'action est enregistrée dans les logs
  - ✅ Vérifier que les détails sont corrects (utilisateur, IP, etc.)

---

## 🖨️ 12. Tests d'Impression

### 12.1 Impression des mouvements
- [ ] **Test 12.1.1** : Imprimer le bordereau avec filtres
  - ✅ Vérifier que le PDF/page imprimée est correct
  - ✅ Vérifier que les statistiques respectent les filtres

### 12.2 Impression des stocks
- [ ] **Test 12.2.1** : Imprimer le stock par banque
  - ✅ Vérifier le logo dans l'en-tête
  - ✅ Vérifier les données affichées

- [ ] **Test 12.2.2** : Imprimer le stock par emplacement
  - ✅ Vérifier le logo dans l'en-tête
  - ✅ Vérifier les données affichées

---

## 🔍 13. Tests de Recherche et Filtrage

### 13.1 Recherche globale
- [ ] **Test 13.1.1** : Utiliser la recherche dans chaque module
  - ✅ Vérifier que la recherche fonctionne en temps réel
  - ✅ Vérifier la recherche multi-champs

### 13.2 Filtres combinés
- [ ] **Test 13.2.1** : Combiner plusieurs filtres dans les mouvements
  - ✅ Vérifier que tous les filtres sont appliqués
  - ✅ Vérifier que les résultats sont corrects

---

## 🐛 14. Tests de Gestion d'Erreurs

### 14.1 Erreurs réseau
- [ ] **Test 14.1.1** : Déconnecter l'internet et effectuer une action
  - ✅ Vérifier l'affichage d'un message d'erreur approprié

### 14.2 Erreurs de validation
- [ ] **Test 14.2.1** : Soumettre un formulaire avec des données invalides
  - ✅ Vérifier l'affichage des messages d'erreur de validation

---

## 📱 15. Tests de Responsivité

### 15.1 Mobile
- [ ] **Test 15.1.1** : Accéder à l'application sur mobile
  - ✅ Vérifier que l'interface est responsive
  - ✅ Vérifier que tous les boutons sont accessibles

### 15.2 Tablette
- [ ] **Test 15.2.1** : Accéder à l'application sur tablette
  - ✅ Vérifier l'adaptation de l'interface

---

## 🔒 16. Tests de Sécurité

### 16.1 Authentification
- [ ] **Test 16.1.1** : Accéder directement à une route API sans authentification
  - ✅ Vérifier que l'accès est refusé

- [ ] **Test 16.1.2** : Tenter d'accéder à `/dashboard` sans être connecté
  - ✅ Vérifier la redirection vers la page de login

### 16.2 Autorisations
- [ ] **Test 16.2.1** : Tenter de modifier une ressource sans permissions
  - ✅ Vérifier que l'action est bloquée

---

## 📝 Notes pour les Tests

### Ordre recommandé d'exécution
1. Authentification
2. Configuration (pour configurer SMTP si nécessaire)
3. Banques
4. Emplacements
5. Cartes
6. Mouvements
7. Utilisateurs
8. Logs et Statistiques

### Données de test recommandées
- Créer au moins 2-3 banques
- Créer 2-3 emplacements par banque
- Créer 5-10 cartes réparties sur les banques
- Créer plusieurs mouvements de différents types

### Points critiques à vérifier
- ✅ **CRITIQUE** : Les statistiques dans l'impression des bordereaux respectent les filtres
- ✅ Les stocks sont calculés correctement (somme par emplacement)
- ✅ Les logs d'audit enregistrent toutes les actions importantes
- ✅ Les emails sont envoyés correctement (si SMTP configuré)

---

**Date de création** : 2026-01-19  
**Version** : 1.0

