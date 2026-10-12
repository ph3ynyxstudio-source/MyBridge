# THEME — MyBr|dge

## Objectif

Ce document définit où se trouvent les éléments liés au thème visuel et aux textes d'interface.

Il ne décrit pas :

```txt
la structure des composants (voir components.md)
le layout de l'écran (voir layout.md)
```

---

## Cohérence avec l'écosystème PH3YNYX.OS

MyBr|dge partage la même base de couleurs que Chr0nosV3rs et VespΣr — fond sombre navy/presque noir, accents cyan et violet. Chaque app garde le droit à une touche distinctive propre (ex: le fond texturé carbone pour MyBr|dge), mais la base reste commune pour que l'écosystème se sente comme un tout, pas trois apps disparates.

---

## Tokens — thème sombre (défaut)

Repris de Chr0nosV3rs, base commune de l'écosystème :

```css
--bg-app: #030611;
--bg-card: rgba(8, 14, 28, 0.65);
--text-primary: #f4f7fb;
--text-secondary: #7b88a1;
--accent-blue: #54d6ff;
--accent-purple: #7e5cff;
```

## Tokens — thème clair "Aube" (V2+, non prioritaire au MVP)

Repris de Chr0nosV3rs, à activer si/quand MyBr|dge reçoit un sélecteur de thème :

```css
--bg-app: #f6f7fa;
--bg-card: #ffffff;
--border-card: #e2e5eb;
--text-primary: #12151c;
--text-secondary: #6b7280;
--accent-blue: #0ea5c4;
--accent-purple: #6d4fd6;
--danger: #d64545;
```

---

## Fond texturé (identité propre à MyBr|dge)

Élément distinctif de MyBr|dge dans l'écosystème : un fond avec texture fine en motif tissé diagonal ("carbone"), discret, en arrière-plan de la zone de contenu principale.

```css
background-color: #0a0d14;
background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2354d6ff' fill-opacity='0.5' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");
```

Source : pattern généré via Hero Patterns (heropatterns.com), motif "Diagonal Stripes", couleur alignée sur `--accent-blue`.

À valider visuellement en contexte réel (dans l'app, pas seulement l'aperçu du générateur) avant de verrouiller l'opacité finale.

---

## Icônes

MyBr|dge utilise la librairie d'icônes SVG partagée de l'écosystème (stockée dans le repo VespΣr) :

```txt
Style : trait (stroke), pas de remplissage plein
viewBox : 0 0 24 24
Couleur : currentColor (suit le texte/thème actif automatiquement)
```

Icône d'identité de MyBr|dge dans le système : **pont suspendu** (`bridge.svg`), cohérente avec le pattern nom→icône déjà en place (sablier = Chr0nosV3rs, étoile = VespΣr, lune = LunarMood).

Toute nouvelle icône créée pour MyBr|dge doit suivre les mêmes conventions (voir governance.md — pas de duplication, mettre à jour la librairie partagée plutôt que d'en créer une locale).

---

## Fichiers concernés (à créer une fois le code démarré)

```txt
src/theme/config.ts
src/theme/design_tokens.ts
src/theme/UI_TERMS.ts
src/App.css
```

Mêmes rôles que dans Chr0nosV3rs :

```txt
config.ts          → flags / configuration simple
design_tokens.ts    → couleurs, espacements, tailles (miroir TS des variables CSS)
UI_TERMS.ts         → textes visibles réutilisés
App.css             → variables CSS globales + styles globaux
```

---

## Règles strictes

### Règle 1

Les couleurs de base restent cohérentes avec Chr0nosV3rs et VespΣr — pas de palette isolée qui romprait l'identité de l'écosystème.

### Règle 2

La touche distinctive de MyBr|dge (fond texturé) reste subtile — jamais au point de nuire à la lisibilité du contenu affiché par-dessus.

### Règle 3

Les icônes viennent de la librairie partagée — jamais dupliquées ou recréées localement dans MyBr|dge.

### Règle 4

Le thème Aube reste V2+ — pas de sélecteur de thème requis au MVP.

### Règle 5

Aucune couleur codée en dur dans un composant — toujours via les tokens.

---

## À éviter

```txt
une palette de couleurs propre à MyBr|dge qui ignore l'écosystème
un fond texturé trop opaque/dominant qui nuit à la lecture des fichiers/dossiers
une icône dupliquée localement au lieu d'être ajoutée à la librairie partagée
```

---

## Phrase simple

```txt
Même base que l'écosystème.
Le carbone est la touche propre à MyBr|dge.
Les icônes sont partagées, jamais dupliquées.
```
