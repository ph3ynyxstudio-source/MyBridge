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
  },
  features: {
    // MVP Lock : fonctionnalités V2+ désactivées ou en simple indicateur visuel
    enableSplitViewV2: false,
    enableListViewToggleV2: false,
    enableDawnThemeV2: false,
  },
} as const;
