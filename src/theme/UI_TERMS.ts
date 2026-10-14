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
    home: "Retour à la racine du projet",
    settings: "Paramètres",
    navBack: "Précédent",
    navForward: "Suivant",
    searchPlaceholder: "Rechercher dans le projet...",
    refresh: "Actualiser le stockage",
    newEntry: "Nouveau dossier / fichier",
    themeToggle: "Basculer le thème (Sombre / Aube)",
  },
  treePanel: {
    sizeToggleCompact: "Passer en vue large",
    sizeToggleLarge: "Passer en vue compacte",
    emptyState: "Aucun projet dans projects/",
  },
  gridView: {
    addTileLabel: "add folder/Files",
    emptyProjectTitle: "Ce dossier de projet est vide",
    emptyProjectSubtitle:
      "Déposez vos fichiers dans la Boîte de dépôt (Inbox) puis transférez-les ici, ou utilisez la tuile d'ajout.",
    noProjectsTitle: "Aucun projet dans le coffre MyBr|dge",
    noProjectsSubtitle:
      "Créez un dossier de projet dans l'espace de stockage local de MyBr|dge (projects/) pour commencer.",
    emptySecondary: "Aucun élément dans ce sous-dossier",
    previewDrawerToggle: "Masquer / afficher le volet secondaire",
    splitViewTitle: "Split-View (2 projets)",
    splitViewClose: "Désactiver le double affichage",
    splitViewSelectProject: "Deuxième projet :",
    splitViewSingleProjectNotice: "Créez un deuxième projet pour l'afficher en Split-View.",
  },
  inboxDrawer: {
    title: "Boîte de dépôt (Inbox)",
    subtitle: "Validez la destination de chaque élément pour que Rust le prenne en charge.",
    close: "Fermer",
    refresh: "Rafraîchir",
    empty: "La Boîte de dépôt est vide. Aucun élément en attente de tri.",
    folderBadge: "Dossier",
    fileBadge: "Fichier",
    targetProjectLabel: "Projet cible",
    targetSubpathLabel: "Sous-dossier (optionnel)",
    targetSubpathPlaceholder: "Racine du projet (ex: 01-Assets)",
    moveButton: "Déplacer",
    movingButton: "Déplacement...",
    noProjectWarning: "Aucun projet disponible dans projects/ pour recevoir cet élément.",
  },
  shortcutsPanel: {
    title: "Raccourcis",
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
  },
} as const;
