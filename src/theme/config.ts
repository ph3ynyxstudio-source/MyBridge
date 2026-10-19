/**
 * CONFIGURATION — MyBr|dge
 * Flags et configuration de base du MVP (voir docs/governance.md et docs/layout.md).
 */

export type TreePanelSize = "compact" | "large";

export const APP_CONFIG = {
  appName: "MyBr|dge",
  identifier: "com.ph3ynyx.mybridge",
  canvas: {
    width: 1920,
    height: 1080,
  },
  defaults: {
    treePanelOpen: true,
    treePanelSize: "compact" as TreePanelSize,
    inboxPendingCount: 1,
    defaultTheme: "dark" as "dark" | "dawn",
    themeStorageKey: "mybridge_theme",
  },
  features: {
    // MVP Lock : fonctionnalités V2+
    enableSplitViewV2: false,
    enableListViewToggleV2: false,
    enableDawnThemeV2: true,
  },
} as const;
