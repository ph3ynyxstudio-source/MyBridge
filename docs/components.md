# COMPONENTS — MyBr|dge

## Objectif

Ce document définit la structure de la librairie de composants.

Il ne décrit pas :

```txt
l'architecture technique
le thème/les couleurs
le stockage des données
```

Il décrit uniquement :

```txt
où vit chaque composant
comment le repo est organisé
```

---

## Règle de structure

Chaque composant réutilisable doit avoir son propre dossier dans `src/components/`.

Exemple :

```txt
src/components/FileRow/
  FileRow.tsx
  FileRow.css
```

Les composants propres à un seul écran peuvent rester dans cet écran.

Exemple :

```txt
src/screens/Explorer/components/
  Breadcrumb/
  Sidebar/
  PreviewPane/
```

---

## Structure verrouillée

```txt
src/
  App.tsx              → assemble l'application
  App.css              → styles globaux seulement

  screens/
    Explorer/
      Explorer.tsx     → assemble l'écran principal (explorateur)
      Explorer.css     → layout de l'écran
      components/
        ...            → composants propres à l'explorateur

  theme/
    config.ts          → flags / config app
    design_tokens.ts   → couleurs, espacements, tailles
    UI_TERMS.ts        → textes visibles

  components/
    FileRow/
      FileRow.tsx      → structure React d'une ligne fichier/dossier
      FileRow.css       → style uniquement de la ligne
    FolderCard/
      ...

  assets/
    ...
```

---

## MVP — composants attendus

```txt
Explorer.tsx           → écran principal, assemble tout
Breadcrumb              → fil d'Ariane (chemin actuel)
FileList / FileRow       → liste des fichiers/dossiers du dossier courant
Sidebar (si retenue)     → raccourcis vers les projets
PreviewPane (si retenue) → aperçu basique d'un fichier sélectionné
```

Cette liste sera précisée une fois `layout.md` rédigé — elle reste volontairement courte pour respecter le MVP LOCK de governance.md.

---

## Règles strictes

### Règle 1

`App.tsx` reste léger et charge l'écran principal.

### Règle 2

`Explorer.tsx` assemble les zones de l'écran (breadcrumb, liste, aperçu, etc.).

### Règle 3

`App.css` garde seulement les styles globaux.

### Règle 4

Un composant garde son style dans son propre `.css`.

### Règle 5

Les composants réutilisables (utilisés dans plus d'un écran) vivent dans `src/components/`.

### Règle 6

Les composants propres à un seul écran vivent dans `src/screens/{écran}/components/`.

### Règle 7

Pas de composant qui accède au filesystem directement — toute donnée vient de Rust via les appels Tauri (voir architecture.md).

---

## À éviter

```txt
un composant qui mélange logique métier et affichage
un composant réutilisable qui vit dans le dossier d'un écran
du style de composant dans App.css
```

---

## Phrase simple

```txt
Chaque composant a son dossier.
App.tsx charge l'écran.
Explorer.tsx assemble les zones.
Le thème vit dans src/theme/.
```
