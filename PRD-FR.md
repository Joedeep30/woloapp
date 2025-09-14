# WOLO SENEGAL — Cahier des charges produit (PRD)

**Propriétaire du document :** Joe Deep (Founder)
**Rédaction :** Assistant IA (Produit & Tech)
**Version :** 1.2 (FR) — *intègre l'état actuel du projet, schéma admin, flux utilisateurs et recommandations d'optimisation*
**Date :** 14 janvier 2025

---

## 1) Résumé exécutif

WOLO est une plateforme locale de célébration d'anniversaire au Sénégal. Les utilisateurs (les **célébrés**) ouvrent une **cagnotte** que leurs proches alimentent pour débloquer des **Packs** (ex. *Pack Ciné*). Le principal levier de croissance passe par le **parrainage** : tout utilisateur peut devenir **parrain**, inviter ses contacts (WhatsApp), et gagner des **points**. Lorsqu'un filleul accepte, confirme son identité et sa **date de naissance**, une page de cagnotte est **pré‑créée** et s'ouvrira **30 jours** avant son anniversaire. Pour les **<18 ans**, la même UI est utilisée, mais la mise en ligne publique est bloquée jusqu'au **consentement du représentant légal** et **vérification d'identité des deux parties (Parrain & Filleul)**.

Côté tech, nous adoptons une **architecture hybride** : **Web (Next.js)** pour l'admin, le SEO et le don sur desktop, et **mobile Flutter** pour les parcours cœur (invites, dons Wave, QR redemption). Back‑end **API‑first** (PostgreSQL + PostgREST) avec **microservices + MCP** (Model Context Protocol) pour permettre l'automatisation/agents sans toucher aux chemins critiques.

---

## 2) État Actuel du Projet

### ✅ **TERMINÉ & FONCTIONNEL**

#### **Infrastructure Frontend**
- ✅ Configuration Next.js 15.2.4 avec TypeScript
- ✅ TailwindCSS + bibliothèque de composants Radix UI
- ✅ React Hook Form avec validation Zod
- ✅ Structure d'authentification avec NextAuth
- ✅ Fondation de design responsive mobile-first
- ✅ Système auto-sync avec intégration GitHub
- ✅ Pipeline de déploiement Vercel configuré

#### **Fonctionnalités de Base Implémentées**
- ✅ Page d'accueil avec fonctionnalité de compte à rebours
- ✅ Popup de collecte d'email avec notifications toast
- ✅ Layout responsive de base et navigation
- ✅ Fondations d'authentification utilisateur
- ✅ Système de notifications toast (React Hot Toast)
- ✅ Infrastructure de gestion de formulaires

#### **Fondations Backend**
- ✅ Structure API dans le répertoire `/api`
- ✅ Architecture microservices planifiée :
  - Fondation service identité
  - Structure gestion utilisateurs
  - Squelette gestion pots
  - Framework traitement paiement (Wave)
  - Fondation service analytics
  - Structure service notifications
  - Passerelle API configurée

#### **Documentation & Planification**
- ✅ Schéma Admin complet (Anglais + Français)
- ✅ Schéma Flux Utilisateurs complet (Anglais + Français)
- ✅ Analyse temporelle et feuille de route d'optimisation
- ✅ Stratégies de croissance virale documentées
- ✅ Objectifs de performance et KPIs définis

### 🚧 **EN COURS / PARTIELLEMENT IMPLÉMENTÉ**

#### **Authentification & Gestion Utilisateurs**
- 🔄 Configuration NextAuth à terminer
- 🔄 Implémentation contrôle d'accès basé sur les rôles (RBAC)
- 🔄 Système de gestion des profils utilisateurs
- 🔄 Intégration connexion sociale (Google/Facebook)

#### **Base de Données & Backend**
- 🔄 Implémentation schéma PostgreSQL
- 🔄 Configuration PostgREST
- 🔄 Points terminaison API microservices
- 🔄 Système de bus d'événements pour communication inter-services

### ❌ **PAS ENCORE IMPLÉMENTÉ**

#### **Fonctionnalités Principales**
- ❌ Système de création et gestion de pots
- ❌ Intégration Wave Mobile Money
- ❌ Intégration WhatsApp pour invitations
- ❌ Système de parrainage/référencement
- ❌ Système de points et récompenses
- ❌ Génération et utilisation de codes QR
- ❌ Système de gestion des partenaires

#### **Fonctionnalités Avancées**
- ❌ Tableaux de bord admin (régulier, super admin, partenaires)
- ❌ Système d'analytics et de rapports
- ❌ Système de notifications (email, SMS, WhatsApp)
- ❌ Application mobile Flutter
- ❌ Vérification d'âge pour utilisateurs <18
- ❌ Système de modération de contenu

#### **Intégrations**
- ❌ Passerelle de paiement Wave
- ❌ API WhatsApp Business
- ❌ Intégrations partenaires cinéma
- ❌ Configuration fournisseur SMS
- ❌ Fournisseur de service email

---

## 3) Objectifs & KPIs

**Objectifs Business**
* Livraison d'un MVP rapide, fluide (Wave), et fiable pour le Sénégal
* Le parrainage devient le 1er canal d'acquisition (≥ 60% de nouveaux utilisateurs via invitations à M+3)
* Premier partenariat opérationnel (cinéma) avec validation QR et suivi de règlements

**KPIs Trimestriels**
* **Activation** : ≥ 55% des filleuls invités acceptent + confirment leur DOB
* **Viralité (K‑factor)** : ≥ 1,2 filleul accepté par parrain actif
* **Conversion** : ≥ 35% des cagnottes ouvertes reçoivent ≥ 1 don avant la date
* **Rédemption** : ≥ 85% des Packs financés consommés ≤ 45 jours après l'anniversaire
* **Performance** : API P95 < 300 ms | TTI P95 < 2,5 s en 3G

---

## 4) Rôles & Personae

* **Personne d'Anniversaire/Propriétaire de Pot** : crée/possède le pot, invite, suit, dépense
* **Donateur** : contribue via Wave ; peut rester anonyme ; message optionnel
* **Parrain** : invite ses contacts ; gagne des points selon l'avancement du filleul
* **WOLO Admin** : opérations complètes (modération, remboursements, contenus, splits, flags)
* **Admin Partenaire (Cinéma)** : **lecture seule** analytics + flux de validations QR
* **Admin Sponsor** : **lecture seule** des campagnes et performances

---

## 5) Feuille de Route d'Implémentation

### **Phase 0 : Durcissement des Fondations (Priorité Actuelle)**
**Calendrier : 2-3 semaines**
- [ ] Terminer l'implémentation du schéma de base de données
- [ ] Finaliser le système d'authentification avec RBAC
- [ ] Implémenter les points terminaison API principaux
- [ ] Configurer gestion d'erreurs et logging appropriés
- [ ] Établir le framework de tests

### **Phase 1 : Fonctionnalités MVP Principales**
**Calendrier : 4-6 semaines**
- [ ] Système de création et gestion de pots
- [ ] Intégration paiement Wave (sandbox → production)
- [ ] Système de parrainage/référencement de base
- [ ] Liens d'invitation WhatsApp
- [ ] Fondation système de points
- [ ] Système de génération de codes QR

### **Phase 1.1 : Amélioration Expérience Utilisateur**
**Calendrier : 2-3 semaines**
- [ ] Implémenter optimisations temporelles de l'analyse des flux utilisateurs
- [ ] Améliorations UX mobile-first
- [ ] Intégration connexion sociale
- [ ] Défauts intelligents et fonctionnalités de pré-remplissage
- [ ] Boutons de don en un clic

### **Phase 1.2 : Admin & Analytics**
**Calendrier : 3-4 semaines**
- [ ] Implémentation tableau de bord admin
- [ ] Tableau de bord partenaire (lecture seule)
- [ ] Analytics et rapports de base
- [ ] Outils de modération de contenu
- [ ] Interface de gestion utilisateurs

### **Phase 2 : Application Mobile Flutter**
**Calendrier : 6-8 semaines**
- [ ] Fondation app Flutter
- [ ] Implémentation parcours utilisateurs principaux
- [ ] Intégration paiement Wave
- [ ] Fonctionnalité caméra/scan QR
- [ ] Notifications push
- [ ] Préparation soumission aux stores

### **Phase 3 : Fonctionnalités Avancées**
**Calendrier : 4-6 semaines**
- [ ] Système de vérification d'âge pour utilisateurs <18
- [ ] Analytics avancés et optimisations IA
- [ ] Fonctionnalités de gamification
- [ ] Système d'intégration partenaires
- [ ] Détection de fraude avancée

---

## 6) Architecture Technique

### **Stack Actuelle**
- **Frontend** : Next.js 15.2.4, TypeScript, TailwindCSS, Radix UI
- **Authentification** : NextAuth (en configuration)
- **Base de Données** : PostgreSQL (planifié)
- **API** : PostgREST + points terminaison personnalisés
- **Déploiement** : Vercel avec auto-déploiement
- **Mobile** : Flutter (planifié pour Phase 2)

### **Architecture Microservices**
1. **Identity** : authentification, sessions, rôles, liens tuteur
2. **Profiles** : données profil, DOB, préférences, vérification d'identité
3. **Referral** : codes, invitations, acceptations, grand livre de points
4. **Pots** : CRUD, états, planification J-30
5. **Donations** : intégration Wave, webhooks, grand livre, remboursements
6. **Packs** : catalogue, prix, promotions sponsor
7. **QR/Redemption** : génération, validation, piste d'audit
8. **Notifications** : templates email/WhatsApp/SMS, logs, tentatives
9. **Analytics** : ingestion d'événements, tableaux de bord
10. **Admin** : feature flags, partage revenus, outils opérationnels

---

## 7) Flux Utilisateurs Clés (Implémenté vs Planifié)

### **Flux de Parrainage (Boucle de Croissance Primaire)**
**Statut** : ❌ Non implémenté
**Temps Cible** : < 2 minutes total
- [ ] Parrain clique sur CTA "Parrainer & Gagner"
- [ ] Sélection contacts WhatsApp et envoi d'invitations
- [ ] Utilisateur parrainé reçoit et accepte invitation
- [ ] Collecte d'identité et pré-création de pot
- [ ] Système d'attribution de points

### **Flux de Création de Pot**
**Statut** : ❌ Non implémenté
**Temps Cible** : < 3 minutes total
- [ ] Personne d'anniversaire crée un compte
- [ ] Configuration de pot avec défauts intelligents
- [ ] Système de partage social et d'invitation
- [ ] Suivi de progression en temps réel

### **Flux de Don**
**Statut** : ❌ Non implémenté
**Temps Cible** : < 2 minutes total
- [ ] Invité découvre pot via lien/social
- [ ] Sélection rapide montant de don
- [ ] Traitement paiement Wave
- [ ] Confirmation de succès et partage

### **Flux de Gestion Admin**
**Statut** : ❌ Non implémenté
- [ ] Accès admin multi-niveaux (Régulier, Super, Partenaire)
- [ ] Modération de contenu et gestion utilisateurs
- [ ] Tableaux de bord analytics
- [ ] Outils de réconciliation paiements

---

## 8) Objectifs de Performance & Optimisation

### **Objectifs d'Optimisation Vitesse**
- **Création Pot** : 3m 00s → 1m 30s (50% d'amélioration)
- **Don Invité** : 2m 00s → 45s (63% d'amélioration)
- **Parrainage** : 2m 00s → 30s (75% d'amélioration)
- **Temps Chargement Mobile** : <1s (objectif classe mondiale)

### **Objectifs Croissance Virale**
- **Coefficient Viral Global** : 0.65 → 1.25+ (92% d'amélioration)
- **Taux d'Activation Parrain** : 20% → 35%
- **Taux d'Acceptation Invitation** : 35% → 50%
- **Taux Partage-vers-Conversion** : 15% → 25%

### **Performance Technique**
- **Temps Réponse API** : P95 < 300ms, P99 < 800ms
- **Time to Interactive** : P95 < 2.5s sur 3G
- **Disponibilité Système** : 99.9% uptime
- **Sécurité** : JWT + cookies HTTP-only, RBAC, logging d'audit

---

## 9) Évaluation des Risques & Atténuation

### **Risques Haute Priorité**
1. **Complexité Intégration Wave** : Atténuation - Commencer avec sandbox, tests approfondis
2. **Expérience Utilisateur Mobile** : Atténuation - Design mobile-first, implémentation Flutter
3. **Adoption Boucle Virale** : Atténuation - Optimisation incentifs, tests utilisateurs
4. **Conformité Réglementaire** : Atténuation - Revue légale précoce, système vérification d'âge

### **Risques Priorité Moyenne**
1. **Performance à l'Échelle** : Atténuation - Tests de charge, stratégie de cache
2. **Intégration Partenaires** : Atténuation - Partenariat initial simple, itération
3. **Prévention Fraude** : Atténuation - Mesures anti-abus système de points

---

## 10) Métriques de Succès & Monitoring

### **Métriques Business**
- Utilisateurs Actifs Mensuels (MAU)
- Taux de conversion entonnoir parrainage
- Taux de succès pots (financés vs non financés)
- Montant moyen de don
- Taux d'utilisation partenaires

### **Métriques Techniques**
- Temps de réponse API et taux d'erreur
- Taux de complétion parcours utilisateurs
- Uptime et disponibilité système
- Fréquence incidents sécurité
- Coût par transaction

### **Métriques Expérience Utilisateur**
- Temps pour compléter actions clés
- Scores de satisfaction utilisateur (NPS)
- Volume tickets support
- Taux d'adoption fonctionnalités

---

## 11) Questions Ouvertes & Décisions Nécessaires

1. **Barème final système de points et plafonds** - politique de financement sponsors
2. **Exigences exactes vérification d'identité** - types de documents, pays, preuves acceptables
3. **Événement déclencheur points** (acceptation vs premier don vs J-30) basé sur unit economics
4. **API WhatsApp Business vs liens profonds** - coût/latence à l'échelle
5. **Calendrier et processus règlement partenaires**
6. **Priorisation Flutter vs Web** basée sur données de comportement utilisateur

---

## 12) Definition of Done (DoD)

### **DoD Technique**
- [ ] Spécifications OpenAPI publiées
- [ ] Configurations PostgREST versionnées
- [ ] Serveurs MCP documentés (schémas d'outils + exemples)
- [ ] CI/CD avec migrations et seeding données démo
- [ ] Monitoring : logs/métriques/traces + alertes
- [ ] Tableaux de bord services implémentés

### **DoD Opérationnel**
- [ ] Procédures replay webhook
- [ ] Workflows traitement remboursements
- [ ] Playbooks réponse incidents QR
- [ ] Procédures export/suppression PII
- [ ] Tableaux de bord monitoring performance
- [ ] Audit sécurité terminé

---

**Ce PRD sera mis à jour au fur et à mesure de l'avancement du développement et de l'implémentation de nouvelles fonctionnalités.**

— **Fin PRD v1.2 (FR)** —