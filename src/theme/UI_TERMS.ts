import { StandardFolderType } from "../services/storageService";

/**
 * UI TERMS & INTERNATIONALISATION (i18n) — MyBr|dge
 * Centralisation de tous les textes et libellés visibles dans l'interface (Français par défaut / Anglais).
 */

export type LanguageMode = "fr" | "en";

export const LANGUAGE_STORAGE_KEY = "mybridge_language";

export const UI_DICTIONARY = {
  fr: {
    appTitle: "MyBr|dge",
    standardFolders: {
      all: "Tous les dossiers",
      docs: "Documents",
      assets: "Images",
      sessions: "Sessions",
      archive: "Archives",
    },
    topbar: {
      toggleTree: "Afficher / masquer l'arborescence",
      inboxTitle: "Boîte de dépôt (Accueil)",
      inboxAlertAlt: "Nouveaux éléments dans la Boîte de dépôt",
      addShortcut: "Créer un nouveau projet (+)",
      home: "Retour à la racine du projet",
      settings: "Paramètres",
      navBack: "Précédent",
      navForward: "Suivant",
      undo: "Annuler la dernière action (Ctrl+Z)",
      redo: "Rétablir l'action annulée (Ctrl+Y)",
      searchPlaceholder: "Recherche globale (projets & Dropbox)...",
      searchCategoryLabel: "Filtrer par catégorie de dossier",
      refresh: "Actualiser le stockage",
      newEntry: "Nouveau dossier / fichier",
      themeToggle: "Basculer le thème (Sombre / Aube)",
      tabTooltip: (project: string) =>
        `Clic simple : sous-dossiers • Double-clic : racine (${project})`,
    },
    popover: {
      openInSecondary: "Ouvrir dans panneau secondaire",
      renameProject: "Renommer le projet",
      deleteProject: "Supprimer le projet",
    },
    treePanel: {
      sizeToggleCompact: "Passer en vue large",
      sizeToggleLarge: "Passer en vue compacte",
      emptyState: "Aucun projet dans projects/",
    },
    gridView: {
      addTileLabel: "Ajouter dossier / fichiers",
      emptyProjectTitle: "Ce dossier de projet est vide",
      emptyProjectSubtitle:
        "Déposez vos fichiers dans la Boîte de dépôt puis transférez-les ici, ou utilisez la tuile d'ajout.",
      noProjectsTitle: "Aucun projet dans le coffre MyBr|dge",
      noProjectsSubtitle:
        "Créez un dossier de projet dans l'espace de stockage local de MyBr|dge pour commencer.",
      emptySecondary: "Aucun élément dans ce sous-dossier",
      previewDrawerToggle: "Masquer / afficher le volet secondaire",
      splitViewTitle: "Split-View (2 projets)",
      splitViewClose: "Désactiver le double affichage",
      splitViewSelectProject: "Deuxième projet :",
      splitViewSingleProjectNotice:
        "Créez un deuxième projet pour l'afficher en Split-View.",
      selectedCount: (count: number) => `${count} éléments sélectionnés`,
      clearSelection: "Effacer la sélection",
      backToRoot: "← Racine",
    },
    globalSearch: {
      title: "Résultats de recherche globale",
      subtitleAll: "Exploration de l'ensemble des projets et de la Boîte de dépôt",
      subtitleFiltered: (categoryLabel: string) =>
        `Filtré sur la catégorie « ${categoryLabel} » dans tous les projets`,
      clearBtn: "Fermer la recherche",
      emptyTitle: "Aucun résultat trouvé",
      emptySubtitle:
        "Aucun fichier ou dossier ne correspond à votre recherche ou au filtre sélectionné.",
      inboxBadge: "Boîte de dépôt",
      folderTag: "Dossier",
      openLocation: "Ouvrir l'emplacement",
    },
    inboxDrawer: {
      title: "Boîte de dépôt",
      subtitle: "Glissez les éléments en attente sur un projet cible",
      close: "Fermer",
      refresh: "Actualiser la liste",
      emptyTitle: "Boîte de dépôt vide",
      empty:
        "Déposez des fichiers dans le dossier 00-Dropbox de votre machine pour les classer ici.",
      noMatchTitle: "Aucun élément correspondant",
      noMatchSubtitle: "Aucun fichier ne correspond au filtre sélectionné.",
      filterAll: "Tous",
      filterImages: "Images",
      filterTexts: "Documents / Textes",
      filterFolders: "Dossiers",
      sortLabel: "Trier :",
      sortDateDesc: "Date (récents)",
      sortDateAsc: "Date (anciens)",
      sortNameAsc: "Nom (A - Z)",
      sortNameDesc: "Nom (Z - A)",
      selectAll: "Tout sélectionner",
      selectedPill: (count: number) => `${count} sélectionné(s)`,
      destTitle: "Mes projets",
      destSubtitle:
        "Glissez-déposez vos fichiers sélectionnés directement sur la carte du projet souhaité",
      movingNotice: "Déplacement en cours...",
      readyToDrag: (count: number) =>
        `${count} élément(s) prêt(s) à être glissé(s)`,
      subfoldersCount: (count: number) =>
        count > 0 ? `${count} sous-dossier(s)` : "Racine du projet",
      dropHere: "Déposer les fichiers ici",
      dropInto: (proj: string) => `Déposer dans « ${proj} »`,
      createCardTitle: "Créer un nouveau projet",
      createCardHint: "Cliquez ou déposez un dossier ici pour le convertir",
      createCardDropHint: "Relâchez le dossier pour le convertir en projet",
      folderBadge: "Dossier",
      fileBadge: "Fichier",
      targetProjectLabel: "Projet cible",
      targetSubpathLabel: "Sous-dossier (optionnel)",
      targetSubpathPlaceholder: "Racine du projet",
      moveButton: "Déplacer",
      movingButton: "Déplacement...",
      noProjectWarning:
        "Aucun projet disponible dans projects/ pour recevoir cet élément.",
    },
    shortcutsPanel: {
      title: "Paramètres & Raccourcis",
      languageLabel: "Langue de l'interface",
      shortcutsSection: "Projets épinglés",
      maxNotice: "maximum de 4",
      legendStar: "Priorité double clic",
      legendCheck: "Activé",
      empty: "Aucun projet disponible dans projects/.",
      limitReached: "Limite de 4 raccourcis atteinte.",
    },
    newProjectInput: {
      placeholder: "Nom du nouveau projet...",
      buttonCreate: "Créer",
      buttonCreating: "Création...",
      emptyError: "Veuillez saisir un nom de projet.",
    },
    ecosystem: {
      sectionLabel: "Raccourcis Écosystème PH3YNYX.OS",
      vesper: "VespΣr",
      chronosvers: "Chr0nosV3rs",
      toggleCollapse: "Replier la barre d'applications",
      toggleExpand: "Déplier la barre d'applications",
      trashLabel: "Corbeille",
    },
    contextMenu: {
      openInSecondary: "Ouvrir dans le panneau secondaire",
      previewFile: "Aperçu du fichier",
      openInSystem: "Ouvrir avec le système",
      copy: "Copier",
      cut: "Couper",
      paste: "Coller",
      rename: "Renommer",
      delete: "Supprimer",
      renameProject: "Renommer le projet",
      deleteProject: "Supprimer le projet",
      refresh: "Actualiser",
    },
    trashDrawer: {
      title: "Corbeille & Archivage Intelligent",
      subtitle:
        "Triez par projet, transférez vers les Archives (99-Archive) ou supprimez définitivement.",
      refresh: "Actualiser",
      emptyTrashBtn: "Vider la corbeille",
      close: "Fermer",
      emptyTitle: "La corbeille est vide",
      emptySubtitle:
        "Glissez des fichiers ou utilisez le clic droit pour envoyer des éléments ici.",
      groupModeLabel: "Regrouper par projet",
      listModeLabel: "Liste chronologique",
      filterAllProjects: "Tous les projets",
      unclassifiedProject: "Projet non spécifié",
      selectTargetProject: "Choisir un projet...",
      archiveGroupBtn: "Tout vers Archives",
      deleteGroupBtn: "Supprimer le groupe",
      archiveItemBtn: "Vers Archives",
      deleteItemBtn: "Supprimer",
      confirmEmptyTitle: "Vider toute la corbeille ?",
      confirmEmptyText:
        "Cette action supprimera définitivement l'ensemble des éléments de la corbeille du stockage local. Cette opération est irréversible.",
      confirmDeleteSelectionTitle: (count: number) =>
        count > 1
          ? `Supprimer définitivement ces ${count} éléments ?`
          : "Supprimer définitivement cet élément ?",
      confirmDeleteSelectionText:
        "Cette suppression définitive du disque est irréversible. Souhaitez-vous continuer ?",
      cancelBtn: "Annuler",
      confirmDeleteBtn: "Confirmer la suppression",
      deletingBtn: "Suppression...",
      archiveSectionTitle: "Compression intelligente des Archives (.zip)",
      archiveSectionSubtitle:
        "Compressez les dossiers 99-Archive volumineux en archives .zip pour alléger vos projets.",
      thresholdWarning: (sizeLabel: string) =>
        `Seuil dépassé (${sizeLabel} non compressés)`,
      uncompressedStats: (count: number, sizeLabel: string) =>
        `${count} élément(s) non compressé(s) • ${sizeLabel}`,
      zipCountBadge: (count: number) => `${count} archive(s) .zip`,
      compressBtn: "Compresser en .zip",
      compressingBtn: "Compression...",
    },
    archiveBanner: {
      thresholdAlertTitle: (project: string, sizeLabel: string) =>
        `Le dossier Archives de « ${project} » atteint ${sizeLabel} non compressés`,
      thresholdAlertSub:
        "Compressez-le en un fichier .zip pour éviter l'encombrement du projet.",
      folderHeaderTitle: (count: number, sizeLabel: string) =>
        `Dossier Archives : ${count} élément(s) non compressé(s) (${sizeLabel})`,
      compressAction: "Compresser les archives (.zip)",
      compressingAction: "Compression ZIP en cours...",
      dismiss: "Ignorer",
    },
  },
  en: {
    appTitle: "MyBr|dge",
    standardFolders: {
      all: "All folders",
      docs: "Documents",
      assets: "Images",
      sessions: "Sessions",
      archive: "Archives",
    },
    topbar: {
      toggleTree: "Show / hide folder tree",
      inboxTitle: "Dropzone (Home)",
      inboxAlertAlt: "Pending items in Dropzone",
      addShortcut: "Create new project (+)",
      home: "Back to project root",
      settings: "Settings",
      navBack: "Back",
      navForward: "Forward",
      undo: "Undo last action (Ctrl+Z)",
      redo: "Redo last action (Ctrl+Y)",
      searchPlaceholder: "Global search (projects & Dropbox)...",
      searchCategoryLabel: "Filter by folder category",
      refresh: "Refresh storage",
      newEntry: "New folder / file",
      themeToggle: "Toggle theme (Dark / Dawn)",
      tabTooltip: (project: string) =>
        `Single click: subfolders • Double click: root (${project})`,
    },
    popover: {
      openInSecondary: "Open in secondary panel",
      renameProject: "Rename project",
      deleteProject: "Delete project",
    },
    treePanel: {
      sizeToggleCompact: "Switch to wide view",
      sizeToggleLarge: "Switch to compact view",
      emptyState: "No projects in projects/",
    },
    gridView: {
      addTileLabel: "Add folder / files",
      emptyProjectTitle: "This project folder is empty",
      emptyProjectSubtitle:
        "Drop your files into the Dropzone then transfer them here, or use the add tile.",
      noProjectsTitle: "No projects in MyBr|dge vault",
      noProjectsSubtitle:
        "Create a project folder in MyBr|dge local storage to get started.",
      emptySecondary: "No items in this subfolder",
      previewDrawerToggle: "Show / hide secondary pane",
      splitViewTitle: "Split-View (2 projects)",
      splitViewClose: "Close split view",
      splitViewSelectProject: "Second project:",
      splitViewSingleProjectNotice:
        "Create a second project to open it in Split-View.",
      selectedCount: (count: number) => `${count} items selected`,
      clearSelection: "Clear selection",
      backToRoot: "← Root",
    },
    globalSearch: {
      title: "Global Search Results",
      subtitleAll: "Searching across all projects and Dropzone",
      subtitleFiltered: (categoryLabel: string) =>
        `Filtered by category "${categoryLabel}" across all projects`,
      clearBtn: "Close search",
      emptyTitle: "No results found",
      emptySubtitle:
        "No files or folders match your search query or selected category filter.",
      inboxBadge: "Dropzone",
      folderTag: "Folder",
      openLocation: "Open location",
    },
    inboxDrawer: {
      title: "Dropzone",
      subtitle: "Drag pending items onto a destination project",
      close: "Close",
      refresh: "Refresh list",
      emptyTitle: "Dropzone is empty",
      empty:
        "Drop files into the 00-Dropbox folder on your machine to organize them here.",
      noMatchTitle: "No matching items",
      noMatchSubtitle: "No files match the selected filter.",
      filterAll: "All",
      filterImages: "Images",
      filterTexts: "Documents / Text",
      filterFolders: "Folders",
      sortLabel: "Sort:",
      sortDateDesc: "Date (newest)",
      sortDateAsc: "Date (oldest)",
      sortNameAsc: "Name (A - Z)",
      sortNameDesc: "Name (Z - A)",
      selectAll: "Select all",
      selectedPill: (count: number) => `${count} selected`,
      destTitle: "My Projects",
      destSubtitle:
        "Drag and drop your selected files directly onto the desired project card",
      movingNotice: "Moving items...",
      readyToDrag: (count: number) => `${count} item(s) ready to drag`,
      subfoldersCount: (count: number) =>
        count > 0 ? `${count} subfolder(s)` : "Project root",
      dropHere: "Drop files here",
      dropInto: (proj: string) => `Drop into "${proj}"`,
      createCardTitle: "Create a new project",
      createCardHint: "Click or drop a folder here to convert it",
      createCardDropHint: "Release folder to convert into a project",
      folderBadge: "Folder",
      fileBadge: "File",
      targetProjectLabel: "Target project",
      targetSubpathLabel: "Subfolder (optional)",
      targetSubpathPlaceholder: "Project root",
      moveButton: "Move",
      movingButton: "Moving...",
      noProjectWarning: "No project available in projects/ to receive this item.",
    },
    shortcutsPanel: {
      title: "Settings & Shortcuts",
      languageLabel: "Interface Language",
      shortcutsSection: "Pinned Projects",
      maxNotice: "maximum of 4",
      legendStar: "Double-click priority",
      legendCheck: "Enabled",
      empty: "No projects available in projects/.",
      limitReached: "Limit of 4 shortcuts reached.",
    },
    newProjectInput: {
      placeholder: "New project name...",
      buttonCreate: "Create",
      buttonCreating: "Creating...",
      emptyError: "Please enter a project name.",
    },
    ecosystem: {
      sectionLabel: "PH3YNYX.OS Ecosystem Shortcuts",
      vesper: "VespΣr",
      chronosvers: "Chr0nosV3rs",
      toggleCollapse: "Collapse app sidebar",
      toggleExpand: "Expand app sidebar",
      trashLabel: "Trash",
    },
    contextMenu: {
      openInSecondary: "Open in secondary panel",
      previewFile: "Preview file",
      openInSystem: "Open with system",
      copy: "Copy",
      cut: "Cut",
      paste: "Paste",
      rename: "Rename",
      delete: "Delete",
      renameProject: "Rename project",
      deleteProject: "Delete project",
      refresh: "Refresh",
    },
    trashDrawer: {
      title: "Smart Trash & Archiving",
      subtitle:
        "Group by project, transfer to Archives (99-Archive) or permanently delete.",
      refresh: "Refresh",
      emptyTrashBtn: "Empty Trash",
      close: "Close",
      emptyTitle: "Trash is empty",
      emptySubtitle:
        "Drag files or right-click items to move them here.",
      groupModeLabel: "Group by project",
      listModeLabel: "Chronological list",
      filterAllProjects: "All projects",
      unclassifiedProject: "Unassigned project",
      selectTargetProject: "Select project...",
      archiveGroupBtn: "Archive All",
      deleteGroupBtn: "Delete Group",
      archiveItemBtn: "To Archives",
      deleteItemBtn: "Delete",
      confirmEmptyTitle: "Empty entire trash?",
      confirmEmptyText:
        "This action will permanently delete all items in the trash from local storage. This cannot be undone.",
      confirmDeleteSelectionTitle: (count: number) =>
        count > 1
          ? `Permanently delete these ${count} items?`
          : "Permanently delete this item?",
      confirmDeleteSelectionText:
        "This permanent deletion from disk cannot be undone. Do you want to proceed?",
      cancelBtn: "Cancel",
      confirmDeleteBtn: "Confirm deletion",
      deletingBtn: "Deleting...",
      archiveSectionTitle: "Smart Archive Compression (.zip)",
      archiveSectionSubtitle:
        "Compress heavy 99-Archive folders into .zip bundles to declutter your projects.",
      thresholdWarning: (sizeLabel: string) =>
        `Threshold exceeded (${sizeLabel} uncompressed)`,
      uncompressedStats: (count: number, sizeLabel: string) =>
        `${count} uncompressed item(s) • ${sizeLabel}`,
      zipCountBadge: (count: number) => `${count} .zip archive(s)`,
      compressBtn: "Compress to .zip",
      compressingBtn: "Compressing...",
    },
    archiveBanner: {
      thresholdAlertTitle: (project: string, sizeLabel: string) =>
        `Archives folder in "${project}" reached ${sizeLabel} uncompressed`,
      thresholdAlertSub:
        "Compress it into a .zip bundle to keep your project lightweight.",
      folderHeaderTitle: (count: number, sizeLabel: string) =>
        `Archives Folder: ${count} uncompressed item(s) (${sizeLabel})`,
      compressAction: "Compress archives (.zip)",
      compressingAction: "Compressing ZIP...",
      dismiss: "Dismiss",
    },
  },
} as const;

export const UI_TERMS = UI_DICTIONARY.fr;

export function getUiTerms(lang: LanguageMode = "fr") {
  return UI_DICTIONARY[lang] || UI_DICTIONARY.fr;
}

/**
 * Convertit un nom de dossier technique sur disque (`01-Docs`, `02-Assets`, `03-Sessions`, `99-Archive`)
 * en son libellé lisible par l'utilisateur (`Documents`, `Images`, `Sessions`, `Archives`) selon la langue active,
 * tout en préservant les noms de fichiers/dossiers personnalisés.
 */
export function formatFolderDisplayName(
  rawName: string,
  folderType?: StandardFolderType | null,
  lang: LanguageMode = "fr"
): string {
  const terms = getUiTerms(lang).standardFolders;
  if (folderType && folderType in terms) {
    return terms[folderType];
  }
  const normalized = rawName.trim().toLowerCase();
  if (normalized === "01-docs" || normalized === "docs") {
    return terms.docs;
  }
  if (normalized === "02-assets" || normalized === "assets") {
    return terms.assets;
  }
  if (normalized === "03-sessions" || normalized === "sessions") {
    return terms.sessions;
  }
  if (normalized === "99-archive" || normalized === "archive") {
    return terms.archive;
  }
  return rawName;
}

