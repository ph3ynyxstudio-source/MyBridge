# LAYOUT — MyBr|dge

## Objectif

Ce document définit la structure visuelle principale de l'application.

Il sert à comprendre où modifier le layout global sans toucher aux composants internes.

Il ne décrit pas :

```txt
les couleurs ou le thème (voir theme.md)
la structure des composants React (voir components.md)
```
## Maquettes de référence

- Spécifications fonctionnelles : `docs/assets/mockup_spec.png` (détail du rôle des boutons et zones)
- Rendu visuel cible : `docs/assets/mockup_clean.png` (alignements et contrastes sans annotations)
---

## Canvas

```txt
1920 x 1080
```

---

## Structure écran (vue simple, un seul panneau)

```txt
mybridge-app
└─ topbar
   ├─ zone gauche
   │  ├─ add-shortcut (+)
   │  ├─ tree-toggle (☰)
   │  ├─ onglets de projets (scroll horizontal si débordement)
   │  └─ split-view-toggle (V2+, voir section dédiée)
   │
   ├─ zone centre
   │  ├─ home (retour à la racine des projets)
   │  ├─ titre "MyBr|dge"
   │  └─ settings (⚙)
   │
   └─ zone droite
      ├─ navigation arrière/avant
      ├─ barre de recherche
      ├─ actualiser
      ├─ nouveau dossier/fichier
      └─ theme-toggle (sombre/aube)
│
└─ contenu principal
   ├─ tree-panel (optionnel, voir section dédiée)
   └─ grid-view
      ├─ dossiers/fichiers du répertoire courant
      └─ tuile "add folder/Files"
```

---

## Zones principales

### topbar

Bandeau du haut, verrouillé en trois zones (gauche / centre / droite).

La zone gauche est celle qui varie le plus selon le nombre de projets épinglés — elle défile horizontalement plutôt que de wrap ou de tronquer.

### tree-panel

Panneau latéral gauche, ouvert/fermé par le bouton ☰.

```txt
Fermé par défaut
Affiche l'arborescence complète des projets (pas seulement les raccourcis épinglés)
Pousse le contenu principal — n'est jamais un overlay flottant par-dessus
```

Deux tailles fixes, pas de redimensionnement libre :

```txt
Compact
Large
```

Bascule entre les deux via une poignée-bouton en bas du panneau.

### grid-view

Zone principale d'affichage du contenu du répertoire courant.

```txt
Dossiers et fichiers affichés en grille (icône + nom)
Élément sélectionné visuellement marqué (bordure/surlignage)
Tuile "add folder/Files" en accent (couleur vive) intégrée à la grille, pas un bouton séparé hors grille
```

---

## Split view (V2+)

Non implémenté au MVP — noté ici pour ne pas être perdu, classé explicitement V2+ selon governance.md.

```txt
Un bouton dédié active/désactive le split (deux panneaux de contenu côte à côte)
À l'activation, choix explicite demandé : même projet ou projet séparé
Un toggle visuel (deux rectangles dans un cercle) reflète l'état actif
Emplacement pressenti : proche des onglets de projets, pour sélection rapide du second projet si mode "séparé"
```

Détails encore à trancher avant implémentation :
- Le toggle est-il visible en permanence ou seulement une fois le split actif ?
- Le second panneau peut-il aussi être un aperçu de fichier plutôt qu'un second dossier ?

---

## Vue grille/liste (V2+)

Non implémenté au MVP. Le MVP reste en vue grille unique — pas de bouton de bascule visible pour l'instant.

---

## Règles strictes

### Règle 1

La topbar garde ses trois zones fixes — un nouvel élément va dans la zone la plus proche de sa fonction (navigation → droite, identité/réglages → centre, sélection de contexte → gauche).

### Règle 2

Le tree-panel pousse le contenu, ne le recouvre jamais.

### Règle 3

Aucune action destructive (suppression) sans confirmation — cohérent avec governance.md.

### Règle 4

Le MVP reste à un seul panneau de contenu — split view est V2+.

### Règle 5

Les couleurs et valeurs partagées viennent de theme.md, jamais codées en dur ici.

---

## À éviter

```txt
ajouter le split view ou le toggle grille/liste avant que le MVP simple soit fonctionnel
faire flotter le tree-panel en overlay par-dessus le contenu
permettre un redimensionnement libre du tree-panel (seulement compact/large)
```

---

## Phrase simple

```txt
Topbar en trois zones fixes.
Le panneau latéral pousse, ne recouvre pas.
La grille affiche, une sélection à la fois.
Le reste attend en V2+.
```
