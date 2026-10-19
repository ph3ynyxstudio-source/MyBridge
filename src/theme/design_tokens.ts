/**
 * DESIGN TOKENS — MyBr|dge
 * Miroir TypeScript des variables CSS globales définies dans src/App.css (voir docs/theme.md).
 * Aucune couleur ni valeur partagée ne doit être codée en dur dans les composants.
 */

export type ThemeMode = "dark" | "dawn";

/**
 * Tokens Thème Sombre (base historique écosystème PH3YNYX.OS)
 */
export const DARK_THEME_TOKENS = {
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
  textOnAccent: "#030611",

  // Accents & alertes
  accentBlue: "#54d6ff",
  accentBlueMuted: "rgba(84, 214, 255, 0.22)",
  accentBlueBorder: "rgba(84, 214, 255, 0.55)",
  accentHover: "rgba(84, 214, 255, 0.12)",
  accentPurple: "#7e5cff",
  accentWarning: "#facc15",
  danger: "#d64545",

  // Bordures & séparateurs
  borderSubtle: "rgba(123, 136, 161, 0.22)",
  borderPanel: "rgba(84, 214, 255, 0.35)",

  // Tuiles & composants
  iconTile: "#d6dbe3",
} as const;

/**
 * Tokens Thème Aube — Palette 1: Brume Matinale (Spécification PH3YNYX.OS)
 * Conforme à la charte MYBR|DGE / VESPΣR / CHR0N0SV3RS
 */
export const DAWN_THEME_TOKENS = {
  // Fond & structure
  bgApp: "#F3F4F6",        // Light morning-mist gray
  bgCarbon: "#F3F4F6",
  bgCard: "#E5E9F0",       // Sidebars / Cards
  bgPanel: "#E5E9F0",
  bgTopbar: "#E5E9F0",
  bgInput: "#FFFFFF",

  // Textes
  textPrimary: "#1E293B",  // Text / Active
  textSecondary: "#64748B",
  textInverse: "#F3F4F6",
  textOnAccent: "#FFFFFF", // Blanc pur sur fond accent dawn-cyan

  // Accents écosystème
  accentBlue: "#00A3A6",       // Energetic dawn-cyan
  accentBlueMuted: "rgba(0, 163, 166, 0.14)",
  accentBlueBorder: "rgba(0, 163, 166, 0.38)",
  accentHover: "#E0F2FE",      // Hover matinal bleu ciel
  accentPurple: "#6d4fd6",
  accentWarning: "#d97706",
  danger: "#dc2626",

  // Bordures & séparateurs
  borderSubtle: "#D8DEE9",     // Border
  borderPanel: "rgba(0, 163, 166, 0.35)",

  // Tuiles & composants
  iconTile: "#00A3A6",
} as const;

export const COLORS = DARK_THEME_TOKENS;

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
