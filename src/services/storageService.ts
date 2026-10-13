import { invoke } from "@tauri-apps/api/core";

/**
 * Miroir TypeScript strict de la struct Rust `InboxItem` (src-tauri/src/storage/mod.rs).
 */
export interface InboxItem {
  nom: string;
  taille: number;
  extension: string | null;
  date_modification: number;
  est_dossier: boolean;
}

/**
 * Miroir TypeScript strict de la struct Rust `ProjectFolder` (src-tauri/src/storage/mod.rs).
 */
export interface ProjectFolder {
  nom: string;
  chemin_relatif: string;
  taille: number;
  est_dossier: boolean;
  enfants_optionnels: ProjectFolder[] | null;
}

/**
 * Récupère la liste complète des éléments en attente dans `inbox/`.
 */
export async function getInboxItems(): Promise<InboxItem[]> {
  return invoke<InboxItem[]>("get_inbox_items");
}

/**
 * Déplace de manière sécurisée un élément de `inbox/` vers `projects/{targetProject}/{targetSubpath}`.
 */
export async function moveInboxItem(
  itemName: string,
  targetProject: string,
  targetSubpath?: string
): Promise<void> {
  const cleanSubpath =
    targetSubpath && targetSubpath.trim().length > 0
      ? targetSubpath.trim()
      : null;

  return invoke<void>("move_inbox_item", {
    itemName,
    targetProject,
    targetSubpath: cleanSubpath,
  });
}

/**
 * Renvoie la liste des noms de projets présents à la racine de `projects/`.
 */
export async function listProjects(): Promise<string[]> {
  return invoke<string[]>("list_projects");
}

/**
 * Lit le contenu d'un projet ou d'un sous-dossier spécifique dans `projects/{projectName}/{subpath}`.
 */
export async function readProjectContents(
  projectName: string,
  subpath?: string
): Promise<ProjectFolder[]> {
  const cleanSubpath =
    subpath && subpath.trim().length > 0 ? subpath.trim() : null;

  return invoke<ProjectFolder[]>("read_project_contents", {
    projectName,
    subpath: cleanSubpath,
  });
}

/**
 * Crée un nouveau projet sous projects/{projectName}.
 */
export async function createProject(projectName: string): Promise<string> {
  const cleanName = projectName.trim();
  return invoke<string>("create_project", { projectName: cleanName });
}
