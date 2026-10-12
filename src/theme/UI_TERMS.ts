/**
 * UI TERMS — MyBr|dge
 * Centralisation de tous les textes et libellés visibles dans l'interface (voir docs/theme.md).
 */

export const UI_TERMS = {
  appTitle: "MyBr|dge",
  topbar: {
    toggleTree: "Afficher / masquer l'arborescence",
    inboxTitle: "Boîte de dépôt (Inbox locale)",
     inboxAlertAlt: "Nouveaux éléments dans la Boîte de dépôt",
    addShortcut: "Épingler un projet (+)",
    home: "Retour à la racine des projets",
    settings: "Paramètres",
    navBack: "Précédent",
    navForward: "Suivant",
    searchPlaceholder: "Rechercher dans le projet...",
    refresh: "Actualiser",
    newEntry: "Nouveau dossier / fichier",
    themeToggle: "Basculer le thème (Sombre / Aube)",
  },
  treePanel: {
    sizeToggleCompact: "Passer en vue large",
    sizeToggleLarge: "Passer en vue compacte",
    emptyState: "Aucun projet dans le stockage local",
  },
  gridView: {
    addTileLabel: "add folder/Files",
    emptyFolder: "Ce dossier est vide",
    previewDrawerToggle: "Masquer / afficher le volet secondaire",
  },
  ecosystem: {
    sectionLabel: "Raccourcis Écosystème PH3YNYX.OS",
    vesper: "VespΣr",
    chronosvers: "Chr0nosV3rs",
  },
} as const;
