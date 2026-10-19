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

MyBr|dge partage la même base de couleurs que Chr0nosV3rs et VespΣr :
- **Thème Sombre (défaut)** : fond navy/presque noir, accents cyan `#54d6ff` et violet `#7e5cff`.
- **Thème Aube (Palette 1: Brume Matinale)** : fond brume matinale clair `#F3F4F6`, panneaux/cartes `#E5E9F0`, accents cyan énergique `#00A3A6`, texte ardoise sombre `#1E293B`, survols bleu ciel `#E0F2FE`.

Chaque app garde le droit à une touche distinctive propre (le fond texturé carbone pour MyBr|dge), mais la base reste commune pour que l'écosystème forme un tout unifié : `MYBR|DGE / VESPΣR / CHR0N0SV3RS`.

---

## Tokens — thème sombre (défaut)

Repris de Chr0nosV3rs, base commune de l'écosystème :

```css
--bg-app: #030611;
--bg-carbon: #0a0d14;
--bg-card: rgba(8, 14, 28, 0.65);
--bg-panel: #07131f;
--bg-topbar: #050814;
--bg-input: #d6dbe3;

--text-primary: #f4f7fb;
--text-secondary: #7b88a1;
--text-inverse: #030611;
--text-on-accent: #030611;

--accent-blue: #54d6ff;
--accent-blue-muted: rgba(84, 214, 255, 0.22);
--accent-blue-border: rgba(84, 214, 255, 0.55);
--accent-hover: rgba(84, 214, 255, 0.12);
--accent-purple: #7e5cff;
--accent-warning: #facc15;
--danger: #d64545;

--border-subtle: rgba(123, 136, 161, 0.22);
--border-panel: rgba(84, 214, 255, 0.35);

--icon-tile: #d6dbe3;
--tab-active-bg: rgba(84, 214, 255, 0.28);
--breadcrumb-bg: rgba(5, 8, 20, 0.45);
```

---

## Tokens — thème clair "Aube" (Palette 1 : Brume Matinale)

Conforme à la spécification visuelle `PH3YNYX.OS` (`MYBR|DGE / VESPΣR / CHR0N0SV3RS`) :

```css
--bg-app: #f3f4f6;          /* Light morning-mist gray */
--bg-carbon: #f3f4f6;
--bg-card: #e5e9f0;         /* Sidebars / Cards */
--bg-panel: #e5e9f0;
--bg-topbar: #e5e9f0;
--bg-input: #ffffff;

--text-primary: #1e293b;    /* Text / Active */
--text-secondary: #64748b;
--text-inverse: #f3f4f6;
--text-on-accent: #ffffff;  /* Blanc sur bouton cyan aube */

--accent-blue: #00a3a6;     /* Energetic dawn-cyan */
--accent-blue-muted: rgba(0, 163, 166, 0.14);
--accent-blue-border: rgba(0, 163, 166, 0.4);
--accent-hover: #e0f2fe;    /* Hover matinal bleu ciel */
--accent-purple: #6d4fd6;
--accent-warning: #d97706;
--danger: #dc2626;

--border-subtle: #d8dee9;   /* Border */
--border-panel: rgba(0, 163, 166, 0.35);

--icon-tile: #00a3a6;       /* Icônes de tuiles en cyan aube */
--tab-active-bg: #ffffff;   /* Onglet actif lumineux */
--breadcrumb-bg: rgba(229, 233, 240, 0.75);
```

---

## Sélecteur et persistance du thème

- **Bouton sélecteur (Topbar)** : pilule interactive ergonomique affichant les icônes Lune 🌙 et Soleil ☀️ avec curseur mobile animé.
- **Attribut HTML** : appliqué sur `document.documentElement` via `data-theme="dawn"` (ou `data-theme="dark"`).
- **Persistance** : mémorisée dans `localStorage` sous la clé `mybridge_theme`.

---

## Fond texturé (identité propre à MyBr|dge)

Élément distinctif de MyBr|dge dans l'écosystème : un fond avec texture fine en motif tissé diagonal ("carbone"), discret, en arrière-plan de la zone de contenu principale.

- En thème Sombre : trame cyan `#54d6ff` à opacité `0.14`.
- En thème Aube : trame cyan énergique `#00a3a6` à opacité subtile `0.04`.

```css
background-image: var(--carbon-pattern);
```

---

## Icônes

MyBr|dge utilise la librairie d'icônes SVG de l'écosystème :

```txt
Style : trait (stroke), pas de remplissage plein
viewBox : 0 0 24 24
Couleur : currentColor ou variable dédiée (--icon-tile / --accent-blue)
```

Icône d'identité de MyBr|dge dans le système : **pont suspendu** (`bridge.svg`), alignée avec le pattern nom→icône :
- Chr0nosV3rs = sablier
- VespΣr = étoile
- MyBr|dge = pont suspendu

---

## Fichiers concernés

```txt
src/theme/config.ts          → flags / configuration (enableDawnThemeV2: true, themeStorageKey)
src/theme/design_tokens.ts   → tokens TS miroirs DARK_THEME_TOKENS & DAWN_THEME_TOKENS
src/theme/UI_TERMS.ts        → textes visibles réutilisés
src/App.css                  → variables CSS globales (:root & [data-theme="dawn"])
src/screens/Explorer/components/Topbar/Topbar.tsx & Topbar.css → pilule de bascule de thème
```

---

## Règles strictes

### Règle 1
Les couleurs de base restent cohérentes avec Chr0nosV3rs et VespΣr — pas de palette isolée.

### Règle 2
La touche distinctive de MyBr|dge (fond texturé carbone) reste subtile — jamais au point de nuire à la lisibilité du contenu affiché par-dessus.

### Règle 3
Les icônes viennent de la charte partagée — toujours adaptées à la lisibilité du thème courant via `currentColor` ou tokens dédiés.

### Règle 4
Le thème Aube respecte scrupuleusement la palette "Brume Matinale" (#F3F4F6, #E5E9F0, #00A3A6, #D8DEE9, #1E293B, #E0F2FE).

### Règle 5
Aucune couleur codée en dur dans un composant — toujours via les tokens de variables CSS.

---

## Phrase simple

```txt
Même base que l'écosystème.
Sombre par défaut, Aube (Brume Matinale) en un clic.
Le carbone est la touche propre à MyBr|dge.
```
