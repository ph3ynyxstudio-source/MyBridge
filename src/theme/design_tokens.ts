/**
 * DESIGN TOKENS — MyBr|dge
 * Miroir TypeScript des variables CSS globales définies dans src/App.css (voir docs/theme.md).
 * Aucune couleur ni valeur partagée ne doit être codée en dur dans les composants.
 */

export const COLORS = {
  // Base écosystème PH3YNYX.OS (Thème sombre par défaut)
  bgApp: "#030611",
  bgCarbon: "#0a0d14",
  bgCard: "rgba(8, 14, 28, 0.65)",
  bgPanel: "#07131f",
  bgTopbar: "#050814",
  bgInput: "#d6dbe3",

  // Textes
  textPrimary: "#f4f7fb",
  textSecondary: "#7b88a1",
  textInverse: "#030611",

  // Accents écosystème & alertes
  accentBlue: "#54d6ff",
  accentBlueMuted: "rgba(84, 214, 255, 0.22)",
  accentBlueBorder: "rgba(84, 214, 255, 0.55)",
  accentPurple: "#7e5cff",
  accentWarning: "#facc15",
  danger: "#d64545",

  // Bordures & séparateurs
  borderSubtle: "rgba(123, 136, 161, 0.22)",
  borderPanel: "rgba(84, 214, 255, 0.35)",
} as const;

export const LAYOUT_SIZES = {
  topbarHeight: "48px",
  treePanelCompactWidth: "220px",
  treePanelLargeWidth: "300px",
  ecosystemSidebarWidth: "68px",
  folderTileWidth: "120px",
  borderRadiusSm: "6px",
  borderRadiusMd: "12px",
  borderRadiusLg: "20px",
} as const;

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
} as const;
