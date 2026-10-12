# GOVERNANCE — MyBr|dge

## Objectif

Ce document définit les règles de fonctionnement du projet.

Il sert de référence pour :

le développement
la documentation
les contributions
l'utilisation d'IA (Claude, Codex, etc.)

Il ne décrit pas :

l'architecture technique détaillée
les couleurs ou le thème
la structure des données

---

# Principe fondamental

L'humain reste le seul décideur du système.

Le système :

```txt
affiche
navigue
synchronise (PC → mobile uniquement)
```

Le système ne :

```txt
décide pas
n'intègre pas d'IA
ne modifie jamais un fichier projet sans action explicite de l'humain
```

---

# MVP LOCK

Le MVP actuel est centré sur :

```txt
Gestionnaire de stockage autonome, propre à MyBr|dge
Stockage direct des projets dans le répertoire de données de l'application (géré en local par Rust/Tauri)
Ingestion par dépôt (Boîte de dépôt / Inbox ou drag-and-drop) avec déplacement et prise en charge par Rust
Affichage et navigation du contenu (dossiers, fichiers, aperçu basique) dans l'interface de l'app
```

Hors MVP actuel (V2+ confirmé mais pas prioritaire) :

```txt
Split-view (double panneau de navigation) et bascule vue Grille/Liste
Version mobile
Sync PC ↔ mobile (same wifi, sens unique PC → mobile)
Réception automatisée des fins de session écrites par Chr0nosV3rs
```

Toute évolution doit respecter ce périmètre.

---

# Règle d'expansion

Toute nouvelle idée doit être classée comme :

```txt
MVP
ou
V2+
```

Avant toute implémentation.

Aucune fonctionnalité ne doit être ajoutée sans classification.

---

# Simplicité avant complexité

Toujours privilégier :

```txt
simple
lisible
maintenable
```

Éviter :

```txt
abstractions inutiles
architecture excessive
sur-ingénierie
multiplication des couches
```

---

# Séparation des responsabilités

## UI (React)

Responsable de :

```txt
affichage
navigation
interaction (sélection, drag-and-drop, déclenchement d'actions)
```

Ne doit pas :

```txt
accéder directement au filesystem
contenir de logique métier
```

## Rust (Tauri)

Responsable de :

```txt
gestion du stockage local autonome de l'application
surveillance de la Boîte de dépôt (Inbox) et déplacement des fichiers ingérés
sécurité et logique métier
orchestration de la sync (V2+)
```

Ne doit pas :

```txt
décider à la place de l'humain
modifier, déplacer ou supprimer un fichier projet sans action explicite
```

---

# Gestionnaire de stockage autonome (Local-First)

MyBr|dge n'est pas un miroir de l'explorateur Windows pointant vers un dossier externe : il possède et gère son propre espace de stockage local (via Rust/Tauri).

```txt
Stockage autonome dans le répertoire de données de l'application
Ingestion par dépôt (Boîte de dépôt / Inbox ou drag-and-drop)
Rust déplace et prend en charge les dossiers et fichiers dans le stockage de MyBr|dge après validation humaine
```

C'est ce mécanisme qui garantit que MyBr|dge maîtrise intégralement l'organisation des projets sans dépendre d'une arborescence externe ni créer de doublons fantômes.

---

# Pas d'IA intégrée

Décision verrouillée (sept. 2026) : MyBr|dge n'intègre aucun modèle IA, aucun chatbot.

Le chat IA de l'écosystème vit dans VespΣr, pas ici.

Cette séparation évite d'alourdir MyBr|dge avec un modèle local en plus du stockage/sync qui grossit avec le temps.

---

# Sync PC ↔ mobile (V2+)

Règles déjà actées pour quand cette phase sera abordée :

```txt
Sync seulement si les deux appareils sont sur le même wifi
Jamais automatique en arrière-plan
Déclenchée par notification, confirmée manuellement
Sens unique : PC → mobile
Mobile toujours en lecture seule côté contenu
```

---

# Documentation

La documentation doit rester courte et utile.

Avant de créer un nouveau document :

poser la question :

```txt
L'information existe-t-elle déjà ?
```

Si oui :

mettre à jour le document existant.

---

# Utilisation des IA

Les IA peuvent :

```txt
proposer
structurer
expliquer
générer du code
documenter
```

Les IA ne peuvent pas :

```txt
prendre des décisions produit
modifier l'architecture sans demande
inventer des besoins
valider à la place de l'humain
```

---

# Règle de modification

Avant une modification importante :

```txt
1. Identifier le besoin.
2. Identifier le fichier concerné.
3. Limiter le changement à la zone concernée.
4. Éviter les effets de bord.
5. Conserver la cohérence du MVP.
```

---

# Source de vérité

En cas de contradiction :

```txt
Code
↓
Documentation
↓
Interprétation
```

La documentation doit être mise à jour si le code change.

---

# Phrase finale

```txt
L'humain décide.
Le système organise.
La documentation guide.
Le code exécute.
```
