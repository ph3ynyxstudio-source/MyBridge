# STORAGE — MyBr|dge

## Objectif

Ce document définit comment les données sont stockées et lues par le système.

Il décrit :

```txt
où vivent les données affichées
comment MyBr|dge y accède
ce que MyBr|dge peut conserver pour lui-même
```

Il ne décrit pas :

```txt
l'interface
les composants
le thème
```

---

## Principe d'ingestion et de stockage autonome

MyBr|dge n'est pas un explorateur pointant vers un dossier Windows externe : il agit comme un **gestionnaire de stockage autonome**.

Les projets et leurs fichiers sont stockés directement dans le répertoire de données de l'application (géré en local par Rust/Tauri) :

```txt
Stockage interne MyBr|dge (AppData / stockage local géré par Rust)
├─ inbox/          → Boîte de dépôt (tampon d'ingestion)
├─ projects/       → Projets pris en charge par MyBr|dge
│  └─ {nom_du_projet}/
└─ config/         → Préférences d'affichage et métadonnées de l'app
```

### Flux d'ingestion

L'entrée de nouveaux dossiers, fichiers ou assets se fait par **dépôt** :
1. **Boîte de dépôt (DropBox / Inbox locale) ou Drag-and-Drop** : les éléments externes sont déposés dans la zone d'ingestion.
2. **Détection et alerte** : Rust surveille la Boîte de dépôt et signale la présence de nouveaux éléments à l'UI (badge d'alerte jaune sur l'icône colis dans la Topbar).
3. **Prise en charge par Rust** : après validation de l'utilisateur, Rust **déplace** et prend en charge les dossiers/fichiers directement dans le stockage interne de MyBr|dge (`projects/{nom_du_projet}/`).

---

## Ce que MyBr|dge gère et affiche

```txt
projects/
└─ {nom_du_projet}/
   └─ (structure propre à chaque projet : 01-Assets, 02-Docs, etc.)
```

Une fois ingéré, chaque projet vit à l'intérieur du stockage géré par MyBr|dge et constitue l'unique source de vérité du contenu.

---

## Ce que MyBr|dge conserve pour sa configuration interne

Données techniques de l'application, séparées des dossiers de projets :

```txt
préférences d'affichage (ex: dernier dossier ouvert, projets épinglés, taille du tree-panel)
état de la Boîte de dépôt (Inbox)
état de la sync PC ↔ mobile (V2+)
```

Ces paramètres restent isolés des dossiers `projects/` afin de ne jamais polluer l'arborescence des projets eux-mêmes.

---

## Règles strictes

### Règle 1

MyBr|dge est un gestionnaire de stockage autonome — il ne dépend d'aucun dossier Windows externe et n'est pas un simple miroir de l'explorateur Windows.

### Règle 2

L'ingestion passe par le dépôt (Inbox / DropBox ou drag-and-drop) : Rust déplace et prend en charge les fichiers dans le stockage local de MyBr|dge.

### Règle 3

MyBr|dge ne déplace, ne modifie et ne supprime jamais un fichier projet sans action explicite de l'humain.

### Règle 4

Les préférences internes de l'application restent séparées des dossiers de projets (`projects/`).

### Règle 5

Aucune transformation ou synthèse automatique des données — MyBr|dge stocke, organise et affiche, il ne calcule rien (voir architecture.md).

---

## À éviter

```txt
pointer vers un dossier Windows externe en mode simple miroir
mélanger les fichiers de configuration de l'app avec le contenu des projets
déplacer ou supprimer des fichiers de l'Inbox sans validation humaine
```

---

## Sync PC ↔ mobile (V2+)

Prévu, non implémenté au MVP :

```txt
Diff entre le stockage local MyBr|dge (PC) et une copie locale mobile
Détection des fichiers manquants côté mobile (.md, images)
Sens unique : PC → mobile
```

Détails complets dans governance.md.

---

## Phrase simple

```txt
L'humain dépose.
Rust déplace et prend en charge.
MyBr|dge gère son propre stockage local.
```
