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
 * Code technique invisible associé aux 4 dossiers structurels standard.
 */
export type StandardFolderType = "docs" | "assets" | "sessions" | "archive";
export type FolderType = StandardFolderType | "custom" | null;

/**
 * Table de correspondance entre codes techniques et libellés standards.
 */
export const STANDARD_FOLDER_MAP: Record<StandardFolderType, string> = {
  docs: "01-Docs",
  assets: "02-Assets",
  sessions: "03-Sessions",
  archive: "99-Archive",
};

export const STANDARD_FOLDER_CODES: StandardFolderType[] = [
  "docs",
  "assets",
  "sessions",
  "archive",
];

/**
 * Miroir TypeScript strict de la struct Rust `ProjectFolder` (src-tauri/src/storage/mod.rs).
 */
export interface ProjectFolder {
  nom: string;
  chemin_relatif: string;
  chemin_absolu?: string;
  folder_type?: StandardFolderType | null;
  taille: number;
  est_dossier: boolean;
  enfants_optionnels: ProjectFolder[] | null;
}

/**
 * Récupère la liste complète des éléments en attente dans `inbox/` ou dans un sous-dossier de l'inbox.
 */
export async function getInboxItems(subpath?: string): Promise<InboxItem[]> {
  const cleanSubpath =
    subpath && subpath.trim().length > 0 ? subpath.trim() : null;
  return invoke<InboxItem[]>("get_inbox_items", { subpath: cleanSubpath });
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

/**
 * Renomme un projet existant dans projects/.
 */
export async function renameProject(
  oldName: string,
  newName: string
): Promise<string> {
  return invoke<string>("rename_project", {
    oldName: oldName.trim(),
    newName: newName.trim(),
  });
}

/**
 * Déplace l'ensemble d'un projet vers la corbeille / archives sécurisée.
 */
export async function deleteProject(projectName: string): Promise<void> {
  return invoke<void>("delete_project", {
    projectName: projectName.trim(),
  });
}

/**
 * Lance une application externe de l'écosystème PH3YNYX.OS (VespΣr ou Chr0nosV3rs).
 */
export async function launchExternalApp(
  appId: "vesper" | "chronosvers"
): Promise<void> {
  return invoke<void>("launch_external_app", { appId });
}

/**
 * Ouvre un fichier spécifique dans l'application par défaut du système hôte (Windows).
 */
export async function openFileInSystem(
  projectName: string,
  subpath: string
): Promise<void> {
  return invoke<void>("open_file_in_system", { projectName, subpath });
}

/**
 * Déplace un élément vers la corbeille sécurisée (trash/).
 */
export async function moveToTrash(
  projectName: string,
  subpath: string
): Promise<void> {
  return invoke<void>("move_to_trash", { projectName, subpath });
}

/**
 * Copie récursivement un fichier ou dossier vers un projet / sous-chemin cible.
 */
export async function copyItem(
  srcProject: string,
  srcSubpath: string,
  destProject: string,
  destSubpath?: string
): Promise<void> {
  return invoke<void>("copy_item", {
    srcProject,
    srcSubpath,
    destProject,
    destSubpath: destSubpath || null,
  });
}

/**
 * Déplace un fichier ou dossier vers un projet / sous-chemin cible.
 */
export async function moveItem(
  srcProject: string,
  srcSubpath: string,
  destProject: string,
  destSubpath?: string
): Promise<void> {
  return invoke<void>("move_item", {
    srcProject,
    srcSubpath,
    destProject,
    destSubpath: destSubpath || null,
  });
}

/**
 * Récupère la liste des éléments présents dans la corbeille.
 */
export async function getTrashItems(): Promise<InboxItem[]> {
  return invoke<InboxItem[]>("get_trash_items");
}

/**
 * Supprime définitivement tout le contenu de la corbeille (action explicite).
 */
export async function emptyTrash(): Promise<void> {
  return invoke<void>("empty_trash");
}

/**
 * Résout et renvoie le chemin absolu d'un fichier sur le disque local de l'hôte.
 */
export async function getFileAbsolutePath(
  projectName: string,
  subpath: string
): Promise<string> {
  return invoke<string>("get_file_absolute_path", { projectName, subpath });
}

/**
 * Lit le contenu texte brut d'un fichier (ex: .txt, .md, .svg) jusqu'à 5 Mo.
 */
export async function readFileText(
  projectName: string,
  subpath: string
): Promise<string> {
  return invoke<string>("read_file_text", { projectName, subpath });
}

/**
 * Sauvegarde le contenu texte dans un fichier (.md, .txt, etc.) et renvoie sa nouvelle taille en octets.
 */
export async function writeTextFile(
  projectName: string,
  subpath: string,
  content: string
): Promise<number> {
  return invoke<number>("write_text_file", {
    projectName,
    subpath,
    content,
  });
}

/**
 * Récupère les métadonnées réelles (taille en octets, date de modification) d'un fichier sur disque.
 */
export async function getFileMetadata(
  projectName: string,
  subpath: string
): Promise<{ size: number; modified: number }> {
  return invoke<{ size: number; modified: number }>("get_file_metadata", {
    projectName,
    subpath,
  });
}

/**
 * Importe un fichier ou dossier externe depuis un chemin natif Windows vers inbox/ ou un projet.
 */
export async function importExternalPath(
  sourcePath: string,
  targetProject?: string,
  targetSubpath?: string
): Promise<string> {
  return invoke<string>("import_external_path", {
    sourcePath,
    targetProject: targetProject || null,
    targetSubpath: targetSubpath || null,
  });
}

/**
 * Écrit les octets d'un fichier déposé via le navigateur/DOM vers inbox/ ou un projet.
 */
export async function saveFileBytes(
  fileName: string,
  bytes: number[],
  targetProject?: string,
  targetSubpath?: string
): Promise<string> {
  return invoke<string>("save_file_bytes", {
    fileName,
    bytes,
    targetProject: targetProject || null,
    targetSubpath: targetSubpath || null,
  });
}
