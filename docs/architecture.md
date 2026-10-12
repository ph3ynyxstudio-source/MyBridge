# ARCHITECTURE — MyBr|dge

## Objectif

Ce document définit comment les couches du système communiquent entre elles.

Il ne décrit pas :

```txt
les composants UI
les couleurs
les textes
les données détaillées
```

Il décrit uniquement :

```txt
qui fait quoi
qui parle à qui
comment une action traverse le système
```

---

## Architecture générale

```txt
UI
↓
Rust
↓
Filesystem
↓
Retour UI
```

## Flux principal

```txt
Utilisateur
↓
UI
↓
Rust
↓
Stockage local MyBr|dge (géré par Rust/Tauri)
↓
Rust
↓
UI
```

---

## Couches du système

### UI Layer

Localisation :

```txt
src/
```

Responsabilités :

```txt
afficher l'arborescence des projets
naviguer entre dossiers/fichiers
déclencher des actions (ingérer depuis l'Inbox/drag-and-drop, ouvrir, prévisualiser)
présenter les résultats
```

Ne doit jamais :

```txt
accéder directement au filesystem
contenir de logique métier
décider quoi afficher sans passer par Rust
```

### Rust Layer

Localisation :

```txt
src-tauri/
```

Responsabilités :

```txt
recevoir les actions UI
gérer le répertoire de stockage autonome de l'application
surveiller la Boîte de dépôt (Inbox) et prendre en charge/déplacer les éléments ingérés
lire la structure des projets et le contenu des fichiers (aperçu)
retourner les résultats à l'UI
orchestrer la sync PC ↔ mobile (V2+)
```

Ne doit jamais :

```txt
prendre des décisions produit
modifier ou déplacer un fichier projet sans action explicite de l'humain
contrôler l'interface
```

### Storage Layer

Localisation :

```txt
Répertoire de données de l'application (géré en local par Rust/Tauri)
```

Responsabilités :

```txt
conserver de manière autonome les projets et leurs fichiers
héberger la Boîte de dépôt (Inbox) avant tri
rester la source de vérité du contenu géré par MyBr|dge
```

Ne doit jamais :

```txt
calculer
décider
valider
```

MyBr|dge est un gestionnaire de stockage autonome : lors de l'ingestion (via la Boîte de dépôt / DropBox ou drag-and-drop), Rust déplace et prend en charge les dossiers/fichiers directement dans le stockage interne de l'application, sur validation explicite de l'humain.

---

## Responsabilités résumées

```txt
UI
→ affiche, navigue et capte les intentions (dépôt, sélection, tri)

Rust
→ orchestre, déplace lors de l'ingestion et gère le stockage local

Storage (interne MyBr|dge)
→ source de vérité autonome du contenu
```

---

## Exemple réel

Ouverture d'un dossier de projet :

```txt
Utilisateur
↓
Clique sur un projet dans l'UI
↓
UI
↓
envoie la demande
↓
Rust
↓
lit le contenu du dossier correspondant dans le stockage MyBr|dge
↓
Storage Layer
↓
retourne la liste des fichiers/sous-dossiers
↓
Rust
↓
UI
↓
affiche le contenu
```

---

## Règles strictes

### Règle 1

UI ne touche jamais le filesystem directement.

### Règle 2

Rust orchestre tous les accès fichiers et l'ingestion dans le stockage de l'application.

### Règle 3

Storage Layer conserve uniquement, ne décide rien.

### Règle 4

Aucune couche ne décide seule.

La validation finale appartient toujours à l'humain — en particulier pour toute ingestion, déplacement ou action modifiant un fichier projet.

### Règle 5

MyBr|dge n'intègre aucune couche IA (voir governance.md).

---

## À éviter

Ne pas créer :

```txt
UI → Filesystem direct
logique métier côté UI
dépendance à un dossier Windows externe en mode miroir
```

Toutes les communications passent par l'orchestration Rust.

---

## Structure actuelle

```txt
src/
src-tauri/
docs/
```

`scripts/` (couche transformation) n'existe pas dans MyBr|dge — contrairement à Chr0nosV3rs, il n'y a pas de synthèse ni de transformation de données à effectuer, seulement du stockage, de l'organisation et de l'affichage.

---

## Phrase simple

```txt
UI affiche et navigue.
Rust orchestre et prend en charge les fichiers.
Le stockage interne de MyBr|dge reste la vérité.
L'humain décide.
```
