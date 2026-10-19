/**
 * NAVIGATION MODE — MyBr|dge
 * Définit le mode de navigation actif dans l'explorateur :
 * - 'split-folder' (défaut) : double-cliquer un dossier ouvre l'arborescence et son contenu
 *   dans le panneau secondaire droit, le panneau central restant au niveau courant.
 * - 'preview-focus' : double-cliquer un dossier navigue normalement à l'intérieur dans le
 *   panneau central, le panneau droit étant réservé à la prévisualisation des fichiers.
 */

export type NavigationMode = "split-folder" | "preview-focus";

export const NAVIGATION_MODE_STORAGE_KEY = "mybridge_navigation_mode";

export const DEFAULT_NAVIGATION_MODE: NavigationMode = "split-folder";

export function loadSavedNavigationMode(): NavigationMode {
  try {
    const saved = localStorage.getItem(NAVIGATION_MODE_STORAGE_KEY);
    if (saved === "split-folder" || saved === "preview-focus") {
      return saved;
    }
  } catch {
    // fallback
  }
  return DEFAULT_NAVIGATION_MODE;
}

export function saveNavigationMode(mode: NavigationMode): void {
  try {
    localStorage.setItem(NAVIGATION_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

