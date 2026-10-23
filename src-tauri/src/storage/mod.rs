use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::time::UNIX_EPOCH;
use tauri::{AppHandle, Manager};

const INBOX_DIR_PATH: &str = r"C:\Ph3yNyx.OS\00-Dropbox";
const PROJECTS_DIR_NAME: &str = "projects";
const TRASH_DIR_NAME: &str = "trash";

/// Élément présent dans la Boîte de dépôt (`C:\Ph3yNyx.OS\00-Dropbox`) ou dans la Corbeille (`trash/`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InboxItem {
    pub nom: String,
    pub taille: u64,
    pub extension: Option<String>,
    pub date_modification: u64,
    pub est_dossier: bool,
}

/// Dossier ou fichier présent à l'intérieur d'un projet (`projects/{project_name}`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectFolder {
    pub nom: String,
    pub chemin_relatif: String,
    pub chemin_absolu: String,
    pub folder_type: Option<String>,
    pub taille: u64,
    pub est_dossier: bool,
    pub enfants_optionnels: Option<Vec<ProjectFolder>>,
}

/// Résout et garantit l'existence de la Boîte de dépôt (`C:\Ph3yNyx.OS\00-Dropbox`),
/// du coffre des projets sous `app_data_dir/projects/` et de la corbeille sous `app_data_dir/trash/`.
pub fn init_storage_dirs(app: &AppHandle) -> Result<(PathBuf, PathBuf), String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Impossible de résoudre app_data_dir : {}", e))?;

    let inbox_dir = PathBuf::from(INBOX_DIR_PATH);
    let projects_dir = base_dir.join(PROJECTS_DIR_NAME);
    let trash_dir = base_dir.join(TRASH_DIR_NAME);

    fs::create_dir_all(&inbox_dir).map_err(|e| {
        format!(
            "Impossible de créer le dossier Boîte de dépôt ({}) : {}",
            INBOX_DIR_PATH, e
        )
    })?;
    fs::create_dir_all(&projects_dir)
        .map_err(|e| format!("Impossible de créer le dossier projects/ : {}", e))?;
    fs::create_dir_all(&trash_dir)
        .map_err(|e| format!("Impossible de créer le dossier trash/ : {}", e))?;

    Ok((inbox_dir, projects_dir))
}

/// Renvoie le chemin absolu du dossier corbeille `app_data_dir/trash/`.
pub fn get_trash_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Impossible de résoudre app_data_dir : {}", e))?;
    let trash_dir = base_dir.join(TRASH_DIR_NAME);
    if !trash_dir.exists() {
        fs::create_dir_all(&trash_dir)
            .map_err(|e| format!("Impossible de créer le dossier trash/ : {}", e))?;
    }
    Ok(trash_dir)
}

/// Vérifie qu'un identifiant simple (nom de fichier ou nom de projet) contient un unique segment valide
/// sans traversée de répertoire (`..` ou séparateurs).
fn validate_single_name(name: &str, label: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(format!("Le paramètre '{}' ne peut pas être vide.", label));
    }

    let path = Path::new(trimmed);
    let mut components = path.components();

    match (components.next(), components.next()) {
        (Some(Component::Normal(os_str)), None) => os_str
            .to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| format!("Le paramètre '{}' contient des caractères invalides.", label)),
        _ => Err(format!(
            "Chemin invalide pour '{}' : traversée ou séparateur interdit.",
            label
        )),
    }
}

/// Vérifie et normalise un sous-chemin relatif optionnel (interdit `..`, `/` racine ou préfixe Windows).
fn validate_relative_subpath(subpath: Option<String>) -> Result<PathBuf, String> {
    let mut clean = PathBuf::new();
    let Some(raw) = subpath else {
        return Ok(clean);
    };

    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(clean);
    }

    for comp in Path::new(trimmed).components() {
        match comp {
            Component::Normal(part) => clean.push(part),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(
                    "Sous-chemin invalide : traversée de répertoire ('..') ou chemin absolu interdit."
                        .to_string(),
                );
            }
        }
    }

    Ok(clean)
}

/// Extrait le timestamp UNIX (en secondes) de dernière modification depuis les métadonnées.
fn extract_modified_timestamp(metadata: &fs::Metadata) -> u64 {
    metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

/// Parcourt le dossier `inbox/` (ou un sous-dossier spécifié) et renvoie la liste complète des éléments en attente.
#[tauri::command]
pub fn get_inbox_items(
    app: AppHandle,
    subpath: Option<String>,
) -> Result<Vec<InboxItem>, String> {
    let (inbox_dir, _) = init_storage_dirs(&app)?;
    let clean_subpath = validate_relative_subpath(subpath)?;
    let target_dir = inbox_dir.join(&clean_subpath);

    if !target_dir.exists() || !target_dir.is_dir() {
        return Err("Le dossier spécifié dans la Boîte de dépôt est introuvable.".to_string());
    }

    let read_dir = fs::read_dir(&target_dir)
        .map_err(|e| format!("Erreur lors de la lecture de inbox/ : {}", e))?;

    let mut items = Vec::new();

    for entry_res in read_dir {
        let entry = entry_res.map_err(|e| format!("Entrée inbox illisible : {}", e))?;
        let path = entry.path();
        let metadata = fs::metadata(&path)
            .or_else(|_| entry.metadata())
            .map_err(|e| format!("Métadonnées inbox illisibles : {}", e))?;

        let nom = entry.file_name().to_string_lossy().to_string();
        let est_dossier = metadata.is_dir();
        let taille = if est_dossier {
            0
        } else {
            fs::metadata(&path)
                .map(|m| m.len())
                .unwrap_or_else(|_| metadata.len())
        };
        let extension = if est_dossier {
            None
        } else {
            path.extension()
                .map(|ext| ext.to_string_lossy().to_string())
        };
        let date_modification = extract_modified_timestamp(&metadata);

        items.push(InboxItem {
            nom,
            taille,
            extension,
            date_modification,
            est_dossier,
        });
    }

    items.sort_by(|a, b| {
        b.est_dossier
            .cmp(&a.est_dossier)
            .then_with(|| a.nom.to_lowercase().cmp(&b.nom.to_lowercase()))
    });

    Ok(items)
}

/// Déplace de manière sécurisée un élément depuis `inbox/` vers `projects/{target_project}/{target_subpath}`.
/// Refuse tout écrasement si la cible existe déjà.
#[tauri::command]
pub fn move_inbox_item(
    app: AppHandle,
    item_name: String,
    target_project: String,
    target_subpath: Option<String>,
) -> Result<(), String> {
    let (inbox_dir, projects_dir) = init_storage_dirs(&app)?;

    let valid_item = validate_relative_subpath(Some(item_name))?;
    let valid_project = validate_single_name(&target_project, "target_project")?;
    let valid_subpath = validate_relative_subpath(target_subpath)?;

    let source_path = inbox_dir.join(&valid_item);
    if !source_path.exists() {
        return Err(format!(
            "L'élément '{:?}' est introuvable dans la Boîte de dépôt.",
            valid_item
        ));
    }

    let project_root = projects_dir.join(&valid_project);
    if !project_root.exists() || !project_root.is_dir() {
        return Err(format!(
            "Le projet cible '{}' n'existe pas dans le coffre projects/.",
            valid_project
        ));
    }

    let target_dir = project_root.join(&valid_subpath);
    if !target_dir.exists() || !target_dir.is_dir() {
        return Err("Le sous-dossier cible spécifié n'existe pas.".to_string());
    }

    let file_name = source_path
        .file_name()
        .ok_or_else(|| "Nom de fichier invalide".to_string())?;
    let destination_path = target_dir.join(file_name);
    if destination_path.exists() {
        return Err(format!(
            "Action refusée : '{:?}' existe déjà dans le dossier cible (aucun écrasement silencieux).",
            file_name
        ));
    }

    move_entry_safely(&source_path, &destination_path)?;

    Ok(())
}

/// Déplace un fichier ou dossier de manière sécurisée (tente rename en priorité,
/// puis bascule sur copie + suppression si restriction d'OS ou cross-device).
fn move_entry_safely(source: &Path, destination: &Path) -> Result<(), String> {
    if fs::rename(source, destination).is_ok() {
        return Ok(());
    }

    if source.is_file() {
        fs::copy(source, destination)
            .map_err(|e| format!("Échec de la copie du fichier : {}", e))?;
        fs::remove_file(source)
            .map_err(|e| format!("Échec de la suppression de la source : {}", e))?;
        Ok(())
    } else if source.is_dir() {
        copy_dir_recursive(source, destination)?;
        fs::remove_dir_all(source)
            .map_err(|e| format!("Échec de la suppression du dossier source : {}", e))?;
        Ok(())
    } else {
        Err("Type d'élément non supporté.".to_string())
    }
}

/// Copie récursive d'un dossier vers une nouvelle destination.
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Impossible de créer le dossier cible '{}' : {}", dst.display(), e))?;

    let entries = fs::read_dir(src)
        .map_err(|e| format!("Impossible de lire le dossier source '{}' : {}", src.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Entrée illisible : {}", e))?;
        let entry_path = entry.path();
        let target_path = dst.join(entry.file_name());

        if entry_path.is_dir() {
            copy_dir_recursive(&entry_path, &target_path)?;
        } else {
            fs::copy(&entry_path, &target_path)
                .map_err(|e| format!("Échec de copie du fichier vers '{}' : {}", target_path.display(), e))?;
        }
    }

    Ok(())
}

/// Renvoie la liste triée des noms de dossiers de projets présents à la racine de `projects/`.
#[tauri::command]
pub fn list_projects(app: AppHandle) -> Result<Vec<String>, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;

    let read_dir = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Erreur lors de la lecture de projects/ : {}", e))?;

    let mut projects = Vec::new();

    for entry_res in read_dir {
        let entry = entry_res.map_err(|e| format!("Entrée projet illisible : {}", e))?;
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Métadonnées projet illisibles : {}", e))?;

        if metadata.is_dir() {
            projects.push(entry.file_name().to_string_lossy().to_string());
        }
    }

    projects.sort_by_key(|name| name.to_lowercase());

    Ok(projects)
}

/// Arborescence standardisée créée automatiquement dans chaque nouveau projet.
pub const STANDARD_SUBFOLDERS: [&str; 4] = [
    "01-Docs",
    "02-Assets",
    "03-Sessions",
    "99-Archive",
];

/// Résout le code technique invisible ('docs', 'assets', 'sessions', 'archive')
/// associé à un dossier structurel standard.
pub fn resolve_folder_type(folder_name: &str) -> Option<&'static str> {
    let lower = folder_name.trim().to_lowercase();
    if folder_name == "01-Docs" || lower.starts_with("01-docs") || lower == "docs" {
        Some("docs")
    } else if folder_name == "02-Assets" || lower.starts_with("02-assets") || lower == "assets" {
        Some("assets")
    } else if folder_name == "03-Sessions" || lower.starts_with("03-sessions") || lower == "sessions" {
        Some("sessions")
    } else if folder_name == "99-Archive" || lower.starts_with("99-archive") || lower == "archive" {
        Some("archive")
    } else {
        None
    }
}

/// Résout un sous-chemin de projet depuis un code technique ('docs', 'assets', etc.),
/// un sous-chemin relatif standard ('01-Docs'), ou un chemin absolu sécurisé restreint à `project_root`.
pub fn resolve_project_subpath(
    project_root: &Path,
    raw_subpath: Option<String>,
) -> Result<PathBuf, String> {
    let Some(raw) = raw_subpath else {
        return Ok(project_root.to_path_buf());
    };
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(project_root.to_path_buf());
    }

    // 1. Résolution des codes techniques structurels
    let mapped = match trimmed.to_lowercase().as_str() {
        "docs" => "01-Docs",
        "assets" => "02-Assets",
        "sessions" => "03-Sessions",
        "archive" => "99-Archive",
        _ => trimmed,
    };

    // 2. Si le chemin passé est absolu, s'assurer qu'il est confiné au répertoire du projet
    let candidate = Path::new(mapped);
    if candidate.is_absolute() {
        if candidate.starts_with(project_root) {
            return Ok(candidate.to_path_buf());
        } else {
            return Err("Chemin absolu hors du répertoire du projet interdit.".to_string());
        }
    }

    // 3. Validation du sous-chemin relatif
    let clean = validate_relative_subpath(Some(mapped.to_string()))?;
    Ok(project_root.join(clean))
}

/// Lit un niveau de dossier et construit la liste des `ProjectFolder`.
fn read_directory_entries(
    dir_path: &Path,
    project_root: &Path,
    include_immediate_children: bool,
) -> Result<Vec<ProjectFolder>, String> {
    let read_dir = fs::read_dir(dir_path)
        .map_err(|e| format!("Impossible de lire le dossier demandé : {}", e))?;

    let mut folders = Vec::new();

    for entry_res in read_dir {
        let entry = entry_res.map_err(|e| format!("Entrée illisible : {}", e))?;
        let path = entry.path();
        let metadata = fs::metadata(&path)
            .or_else(|_| entry.metadata())
            .map_err(|e| format!("Métadonnées illisibles : {}", e))?;

        let nom = entry.file_name().to_string_lossy().to_string();
        let est_dossier = metadata.is_dir();
        let taille = if est_dossier {
            0
        } else {
            fs::metadata(&path)
                .map(|m| m.len())
                .unwrap_or_else(|_| metadata.len())
        };

        let rel_path = path
            .strip_prefix(project_root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");

        let chemin_absolu = path.to_string_lossy().replace('\\', "/");
        let folder_type = if est_dossier {
            resolve_folder_type(&nom).map(|s| s.to_string())
        } else {
            None
        };

        let enfants_optionnels = if est_dossier && include_immediate_children {
            read_directory_entries(&path, project_root, false).ok()
        } else {
            None
        };

        folders.push(ProjectFolder {
            nom,
            chemin_relatif: rel_path,
            chemin_absolu,
            folder_type,
            taille,
            est_dossier,
            enfants_optionnels,
        });
    }

    folders.sort_by(|a, b| {
        b.est_dossier
            .cmp(&a.est_dossier)
            .then_with(|| a.nom.to_lowercase().cmp(&b.nom.to_lowercase()))
    });

    Ok(folders)
}

/// Lit le contenu du dossier spécifié à l'intérieur de `projects/{project_name}/{subpath}`.
/// Accepte un sous-chemin relatif, un code technique ('docs', 'assets', 'sessions', 'archive'),
/// ou un chemin absolu restreint au projet.
#[tauri::command]
pub fn read_project_contents(
    app: AppHandle,
    project_name: String,
    subpath: Option<String>,
) -> Result<Vec<ProjectFolder>, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;

    let valid_project = validate_single_name(&project_name, "project_name")?;
    let project_root = projects_dir.join(&valid_project);
    if !project_root.exists() || !project_root.is_dir() {
        return Err(format!(
            "Le projet '{}' est introuvable dans projects/.",
            valid_project
        ));
    }

    let target_dir = resolve_project_subpath(&project_root, subpath)?;
    if !target_dir.exists() {
        if let Ok(rel) = target_dir.strip_prefix(&project_root) {
            let rel_str = rel.to_string_lossy().replace('\\', "/");
            if STANDARD_SUBFOLDERS.iter().any(|&s| s == rel_str) {
                fs::create_dir_all(&target_dir).map_err(|e| {
                    format!(
                        "Impossible de créer le sous-dossier standard '{}' : {}",
                        rel_str, e
                    )
                })?;
            } else {
                return Err("Le dossier demandé n'existe pas dans ce projet.".to_string());
            }
        } else {
            return Err("Le dossier demandé n'existe pas dans ce projet.".to_string());
        }
    } else if !target_dir.is_dir() {
        return Err("Le dossier demandé n'existe pas dans ce projet.".to_string());
    }

    read_directory_entries(&target_dir, &project_root, true)
}

/// Crée un nouveau dossier de projet dans le coffre `projects/{project_name}`
/// avec l'arborescence standardisée (01-Docs, 02-Assets, 03-Sessions, 99-Archive).
/// Renvoie une erreur si le nom est invalide ou si le projet existe déjà.
#[tauri::command]
pub fn create_project(app: AppHandle, project_name: String) -> Result<String, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let valid_name = validate_single_name(&project_name, "project_name")?;

    let project_dir = projects_dir.join(&valid_name);
    if project_dir.exists() {
        return Err(format!(
            "Le projet '{}' existe déjà dans le coffre.",
            valid_name
        ));
    }

    fs::create_dir_all(&project_dir).map_err(|e| {
        format!(
            "Impossible de créer le dossier pour le projet '{}' : {}",
            valid_name, e
        )
    })?;

    // Création automatique de l'arborescence standardisée
    for sub in STANDARD_SUBFOLDERS {
        let sub_path = project_dir.join(sub);
        let _ = fs::create_dir_all(&sub_path);
    }

    Ok(valid_name)
}

/// Convertit un dossier présent dans la Boîte de dépôt (`inbox/{folder_path}`) en un nouveau projet
/// sous `projects/{project_name}`, initialise les 4 dossiers structurels (`01-Docs`, `02-Assets`,
/// `03-Sessions`, `99-Archive`) et y déplace proprement tous les fichiers et sous-dossiers.
#[tauri::command]
pub fn convert_inbox_folder_to_project(
    app: AppHandle,
    folder_path: String,
    project_name: String,
) -> Result<String, String> {
    let (inbox_dir, projects_dir) = init_storage_dirs(&app)?;
    let valid_folder = validate_relative_subpath(Some(folder_path))?;
    if valid_folder.as_os_str().is_empty() {
        return Err("Le chemin du dossier source ne peut pas être vide.".to_string());
    }

    let source_dir = inbox_dir.join(&valid_folder);
    if !source_dir.exists() || !source_dir.is_dir() {
        return Err("Le dossier sélectionné est introuvable dans la Boîte de dépôt.".to_string());
    }

    let valid_name = validate_single_name(&project_name, "project_name")?;
    let project_dir = projects_dir.join(&valid_name);
    if project_dir.exists() {
        return Err(format!(
            "Un projet nommé '{}' existe déjà dans le coffre.",
            valid_name
        ));
    }

    // 1. Création du projet et des 4 sous-dossiers structurels
    fs::create_dir_all(&project_dir).map_err(|e| {
        format!(
            "Impossible de créer le dossier pour le projet '{}' : {}",
            valid_name, e
        )
    })?;

    for sub in STANDARD_SUBFOLDERS {
        let sub_path = project_dir.join(sub);
        fs::create_dir_all(&sub_path).map_err(|e| {
            format!(
                "Impossible de créer le sous-dossier standard '{}' : {}",
                sub, e
            )
        })?;
    }

    // 2. Déplacement propre des fichiers et sous-dossiers du dossier source
    let entries = fs::read_dir(&source_dir)
        .map_err(|e| format!("Impossible de lire le dossier source : {}", e))?;

    for entry_res in entries {
        let entry = entry_res.map_err(|e| format!("Entrée illisible : {}", e))?;
        let entry_path = entry.path();
        let entry_name = entry.file_name().to_string_lossy().to_string();

        // Si le dossier source contient déjà un sous-dossier structurel standard, fusionner son contenu
        if entry_path.is_dir() {
            if let Some(code) = resolve_folder_type(&entry_name) {
                let target_std_name = match code {
                    "docs" => "01-Docs",
                    "assets" => "02-Assets",
                    "sessions" => "03-Sessions",
                    "archive" => "99-Archive",
                    _ => &entry_name,
                };
                let target_std_dir = project_dir.join(target_std_name);
                if let Ok(sub_entries) = fs::read_dir(&entry_path) {
                    for sub_res in sub_entries.flatten() {
                        let sub_src = sub_res.path();
                        let sub_dst = target_std_dir.join(sub_res.file_name());
                        move_entry_safely(&sub_src, &sub_dst)?;
                    }
                }
                let _ = fs::remove_dir_all(&entry_path);
                continue;
            }
        }

        let dest_path = project_dir.join(&entry_name);
        move_entry_safely(&entry_path, &dest_path)?;
    }

    // 3. Suppression du dossier source désormais vide dans l'Inbox
    let _ = fs::remove_dir_all(&source_dir);

    Ok(valid_name)
}

/// Renomme un dossier de projet existant dans le coffre `projects/`.
#[tauri::command]
pub fn rename_project(
    app: AppHandle,
    old_name: String,
    new_name: String,
) -> Result<String, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let valid_old = validate_single_name(&old_name, "old_name")?;
    let valid_new = validate_single_name(&new_name, "new_name")?;

    let old_dir = projects_dir.join(&valid_old);
    if !old_dir.exists() || !old_dir.is_dir() {
        return Err(format!("Le projet '{}' est introuvable.", valid_old));
    }

    let new_dir = projects_dir.join(&valid_new);
    if new_dir.exists() {
        return Err(format!("Un projet nommé '{}' existe déjà.", valid_new));
    }

    fs::rename(&old_dir, &new_dir).map_err(|e| {
        format!(
            "Impossible de renommer le projet de '{}' vers '{}' : {}",
            valid_old, valid_new, e
        )
    })?;

    Ok(valid_new)
}

/// Déplace l'ensemble d'un dossier de projet vers la corbeille (`app_data_dir/trash/`) avec horodatage.
/// Tous les sous-dossiers et fichiers contenus sont archivés ensemble dans la corbeille.
#[tauri::command]
pub fn delete_project(app: AppHandle, project_name: String) -> Result<(), String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let trash_dir = get_trash_dir(&app)?;

    let valid_project = validate_single_name(&project_name, "project_name")?;
    let src = projects_dir.join(&valid_project);

    if !src.exists() || !src.is_dir() {
        return Err(format!("Le projet '{}' est introuvable.", valid_project));
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let trash_name = format!("{}_{}", timestamp, valid_project);
    let dest = trash_dir.join(trash_name);

    move_entry_safely(&src, &dest)?;

    Ok(())
}

/// Métadonnées détaillées d'un fichier.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadataInfo {
    pub size: u64,
    pub modified: u64,
}

/// Lit la taille réelle et l'horodatage d'un fichier via fs::metadata.
#[tauri::command]
pub fn get_file_metadata(
    app: AppHandle,
    project_name: String,
    subpath: String,
) -> Result<FileMetadataInfo, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(Some(subpath))?;

    let file_path = projects_dir.join(&valid_project).join(&valid_subpath);
    if !file_path.exists() {
        return Err("Fichier introuvable sur le disque.".to_string());
    }

    let meta = fs::metadata(&file_path)
        .map_err(|e| format!("Impossible de lire les métadonnées : {}", e))?;

    let size = meta.len();
    let modified = extract_modified_timestamp(&meta);

    Ok(FileMetadataInfo { size, modified })
}

/// Écrit ou sauvegarde le contenu texte dans un fichier texte existant ou nouveau
/// et renvoie la taille réelle du fichier sur le disque via `std::fs::metadata().len()`.
#[tauri::command]
pub fn write_text_file(
    app: AppHandle,
    project_name: String,
    subpath: String,
    content: String,
) -> Result<u64, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(Some(subpath))?;

    if valid_subpath.as_os_str().is_empty() {
        return Err("Le sous-chemin du fichier ne peut pas être vide.".to_string());
    }

    let file_path = projects_dir.join(&valid_project).join(&valid_subpath);

    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Impossible de créer le dossier parent : {}", e))?;
        }
    }

    fs::write(&file_path, content.as_bytes())
        .map_err(|e| format!("Impossible d'enregistrer le fichier : {}", e))?;

    let size = fs::metadata(&file_path)
        .map(|m| m.len())
        .unwrap_or(content.len() as u64);

    Ok(size)
}

/// Importe un fichier ou dossier externe (depuis son chemin natif Windows) vers inbox/ ou vers un projet cible.
#[tauri::command]
pub fn import_external_path(
    app: AppHandle,
    source_path: String,
    target_project: Option<String>,
    target_subpath: Option<String>,
) -> Result<String, String> {
    let (inbox_dir, projects_dir) = init_storage_dirs(&app)?;
    let src = PathBuf::from(&source_path);

    if !src.exists() {
        return Err(format!("Le chemin source n'existe pas : {}", source_path));
    }

    let file_name = src
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .ok_or_else(|| "Nom de fichier invalide.".to_string())?;

    let dest_dir = if let Some(proj) = target_project {
        let valid_proj = validate_single_name(&proj, "target_project")?;
        let valid_sub = validate_relative_subpath(target_subpath)?;
        let p = projects_dir.join(valid_proj).join(valid_sub);
        if !p.exists() {
            fs::create_dir_all(&p)
                .map_err(|e| format!("Impossible de créer le dossier de destination : {}", e))?;
        }
        p
    } else {
        inbox_dir
    };

    let dest = dest_dir.join(&file_name);

    if src.is_file() {
        fs::copy(&src, &dest)
            .map_err(|e| format!("Impossible de copier le fichier : {}", e))?;
    } else if src.is_dir() {
        copy_dir_recursive(&src, &dest)?;
    }

    Ok(file_name)
}

/// Enregistre les octets d'un fichier transféré directement via le DOM vers inbox/ ou un projet cible.
#[tauri::command]
pub fn save_file_bytes(
    app: AppHandle,
    file_name: String,
    bytes: Vec<u8>,
    target_project: Option<String>,
    target_subpath: Option<String>,
) -> Result<String, String> {
    let (inbox_dir, projects_dir) = init_storage_dirs(&app)?;
    let valid_name = validate_single_name(&file_name, "file_name")?;

    let dest_dir = if let Some(proj) = target_project {
        let valid_proj = validate_single_name(&proj, "target_project")?;
        let valid_sub = validate_relative_subpath(target_subpath)?;
        let p = projects_dir.join(valid_proj).join(valid_sub);
        if !p.exists() {
            fs::create_dir_all(&p)
                .map_err(|e| format!("Impossible de créer le dossier de destination : {}", e))?;
        }
        p
    } else {
        inbox_dir
    };

    let dest = dest_dir.join(&valid_name);
    fs::write(&dest, &bytes)
        .map_err(|e| format!("Impossible d'écrire le fichier sur le disque : {}", e))?;

    Ok(valid_name)
}

/// Ouvre un fichier spécifique dans l'application par défaut de Windows.
/// Valide le nom du projet et le sous-chemin pour empêcher toute traversée (`..`).
#[tauri::command]
pub fn open_file_in_system(
    app: AppHandle,
    project_name: String,
    subpath: String,
) -> Result<(), String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;

    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(Some(subpath))?;

    if valid_subpath.as_os_str().is_empty() {
        return Err("Le sous-chemin du fichier ne peut pas être vide.".to_string());
    }

    let project_root = projects_dir.join(&valid_project);
    if !project_root.exists() || !project_root.is_dir() {
        return Err(format!(
            "Le projet '{}' est introuvable dans projects/.",
            valid_project
        ));
    }

    let file_path = project_root.join(&valid_subpath);
    if !file_path.exists() {
        return Err(format!(
            "Le fichier est introuvable sur le disque : {:?}",
            file_path
        ));
    }

    if file_path.is_dir() {
        return Err("La cible est un dossier, impossible de l'ouvrir comme un fichier.".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Impossible d'ouvrir le fichier dans le système : {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        use tauri_plugin_opener::OpenerExt;
        let path_str = file_path.to_string_lossy().to_string();
        app.opener()
            .open_path(path_str, None::<&str>)
            .map_err(|e| format!("Impossible d'ouvrir le fichier : {}", e))?;
    }

    Ok(())
}

/// Résout et renvoie le chemin absolu d'un fichier du coffre sur le disque hôte.
#[tauri::command]
pub fn get_file_absolute_path(
    app: AppHandle,
    project_name: String,
    subpath: String,
) -> Result<String, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(Some(subpath))?;

    if valid_subpath.as_os_str().is_empty() {
        return Err("Le sous-chemin du fichier ne peut pas être vide.".to_string());
    }

    let project_root = projects_dir.join(&valid_project);
    if !project_root.exists() || !project_root.is_dir() {
        return Err(format!(
            "Le projet '{}' est introuvable dans projects/.",
            valid_project
        ));
    }

    let file_path = project_root.join(&valid_subpath);
    if !file_path.exists() {
        return Err(format!(
            "Le fichier est introuvable sur le disque : {:?}",
            file_path
        ));
    }

    Ok(file_path.to_string_lossy().to_string())
}

/// Lit le contenu texte d'un fichier (ex: .txt, .md, .svg) dans la limite de 5 Mo.
#[tauri::command]
pub fn read_file_text(
    app: AppHandle,
    project_name: String,
    subpath: String,
) -> Result<String, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(Some(subpath))?;

    if valid_subpath.as_os_str().is_empty() {
        return Err("Le sous-chemin du fichier ne peut pas être vide.".to_string());
    }

    let project_root = projects_dir.join(&valid_project);
    if !project_root.exists() || !project_root.is_dir() {
        return Err(format!(
            "Le projet '{}' est introuvable dans projects/.",
            valid_project
        ));
    }

    let file_path = project_root.join(&valid_subpath);
    if !file_path.exists() {
        return Err(format!(
            "Le fichier est introuvable sur le disque : {:?}",
            file_path
        ));
    }

    if file_path.is_dir() {
        return Err("La cible est un dossier, impossible de lire son contenu texte.".to_string());
    }

    let metadata = fs::metadata(&file_path)
        .map_err(|e| format!("Impossible de lire les métadonnées : {}", e))?;
    if metadata.len() > 5 * 1024 * 1024 {
        return Err("Le fichier est trop volumineux pour être prévisualisé en texte (> 5 Mo).".to_string());
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("Impossible de lire le contenu texte du fichier (UTF-8 requis) : {}", e))
}

/// Déplace un élément d'un projet vers la corbeille (`app_data_dir/trash/`) avec horodatage.
#[tauri::command]
pub fn move_to_trash(
    app: AppHandle,
    project_name: String,
    subpath: String,
) -> Result<(), String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;
    let trash_dir = get_trash_dir(&app)?;

    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(Some(subpath))?;

    if valid_subpath.as_os_str().is_empty() {
        return Err("Le sous-chemin de l'élément à supprimer ne peut pas être vide.".to_string());
    }

    let src = projects_dir.join(&valid_project).join(&valid_subpath);
    if !src.exists() {
        return Err(format!("L'élément à supprimer n'existe pas : {:?}", src));
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let original_name = src
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_else(|| "element".to_string());

    let trash_name = format!("{}_{}", timestamp, original_name);
    let dest = trash_dir.join(trash_name);

    move_entry_safely(&src, &dest)?;

    Ok(())
}

/// Copie récursivement un élément (fichier ou dossier) vers un autre projet/dossier.
#[tauri::command]
pub fn copy_item(
    app: AppHandle,
    src_project: String,
    src_subpath: String,
    dest_project: String,
    dest_subpath: Option<String>,
) -> Result<(), String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;

    let valid_src_proj = validate_single_name(&src_project, "src_project")?;
    let valid_src_sub = validate_relative_subpath(Some(src_subpath))?;

    let valid_dest_proj = validate_single_name(&dest_project, "dest_project")?;
    let valid_dest_sub = validate_relative_subpath(dest_subpath)?;

    let source_path = projects_dir.join(&valid_src_proj).join(&valid_src_sub);
    if !source_path.exists() {
        return Err(format!("L'élément source n'existe pas : {:?}", source_path));
    }

    // Détermination de destination_path (si dest_subpath se termine par un nom ou est un dossier)
    let destination_path = if valid_dest_sub.as_os_str().is_empty() {
        let file_name = source_path
            .file_name()
            .ok_or_else(|| "Nom de fichier source invalide".to_string())?;
        projects_dir.join(&valid_dest_proj).join(file_name)
    } else {
        let candidate = projects_dir.join(&valid_dest_proj).join(&valid_dest_sub);
        if candidate.is_dir() {
            let file_name = source_path
                .file_name()
                .ok_or_else(|| "Nom de fichier source invalide".to_string())?;
            candidate.join(file_name)
        } else {
            candidate
        }
    };

    // Trouver le VRAI dossier parent et faire fs::create_dir_all UNIQUEMENT sur ce parent
    if let Some(parent) = destination_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Impossible de créer le dossier parent : {}", e))?;
        }
    }

    // Gestion des doublons pour la copie
    let mut final_dest_path = destination_path;
    if final_dest_path.exists() {
        let parent = final_dest_path
            .parent()
            .ok_or_else(|| "Dossier parent introuvable".to_string())?;
        let file_name = final_dest_path
            .file_name()
            .ok_or_else(|| "Nom de destination invalide".to_string())?
            .to_string_lossy()
            .to_string();
        let stem = Path::new(&file_name)
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "copie".to_string());
        let ext = Path::new(&file_name)
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();

        let mut counter = 1;
        loop {
            let candidate_name = if counter == 1 {
                format!("{} - Copie{}", stem, ext)
            } else {
                format!("{} - Copie ({}){}", stem, counter, ext)
            };
            let candidate_path = parent.join(&candidate_name);
            if !candidate_path.exists() {
                final_dest_path = candidate_path;
                break;
            }
            counter += 1;
        }
    }

    // Assure-toi de vérifier source_path.is_file() avant de copier
    if source_path.is_file() {
        fs::copy(&source_path, &final_dest_path)
            .map_err(|e| format!("Erreur lors de la copie du fichier : {}", e))?;
    } else if source_path.is_dir() {
        copy_dir_recursive(&source_path, &final_dest_path)
            .map_err(|e| format!("Erreur lors de la copie du dossier : {}", e))?;
    } else {
        return Err("L'élément source n'est ni un fichier ni un dossier valide.".to_string());
    }

    Ok(())
}

/// Déplace un élément (fichier ou dossier) vers un autre projet/dossier.
#[tauri::command]
pub fn move_item(
    app: AppHandle,
    src_project: String,
    src_subpath: String,
    dest_project: String,
    dest_subpath: Option<String>,
) -> Result<(), String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;

    let valid_src_proj = validate_single_name(&src_project, "src_project")?;
    let valid_src_sub = validate_relative_subpath(Some(src_subpath))?;

    let valid_dest_proj = validate_single_name(&dest_project, "dest_project")?;
    let valid_dest_sub = validate_relative_subpath(dest_subpath)?;

    let source_path = projects_dir.join(&valid_src_proj).join(&valid_src_sub);
    if !source_path.exists() {
        return Err(format!("L'élément source n'existe pas : {:?}", source_path));
    }

    let destination_path = if valid_dest_sub.as_os_str().is_empty() {
        let file_name = source_path
            .file_name()
            .ok_or_else(|| "Nom de fichier source invalide".to_string())?;
        projects_dir.join(&valid_dest_proj).join(file_name)
    } else {
        let candidate = projects_dir.join(&valid_dest_proj).join(&valid_dest_sub);
        if candidate.is_dir() {
            let file_name = source_path
                .file_name()
                .ok_or_else(|| "Nom de fichier source invalide".to_string())?;
            candidate.join(file_name)
        } else {
            candidate
        }
    };

    if destination_path == source_path {
        return Ok(());
    }

    if source_path.is_dir() && destination_path.starts_with(&source_path) {
        return Err("Impossible de déplacer un dossier à l'intérieur de lui-même.".to_string());
    }

    // Utiliser destination_path.parent() pour trouver le VRAI dossier parent et faire fs::create_dir_all UNIQUEMENT sur ce parent
    if let Some(parent) = destination_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Impossible de créer le dossier parent : {}", e))?;
        }
    }

    let mut final_dest_path = destination_path;
    if final_dest_path.exists() {
        let parent = final_dest_path
            .parent()
            .ok_or_else(|| "Dossier parent introuvable".to_string())?;
        let file_name = final_dest_path
            .file_name()
            .ok_or_else(|| "Nom de destination invalide".to_string())?
            .to_string_lossy()
            .to_string();
        let stem = Path::new(&file_name)
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "element".to_string());
        let ext = Path::new(&file_name)
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();

        let mut counter = 1;
        loop {
            let candidate_name = format!("{} ({}){}", stem, counter, ext);
            let candidate_path = parent.join(&candidate_name);
            if !candidate_path.exists() {
                final_dest_path = candidate_path;
                break;
            }
            counter += 1;
        }
    }

    move_entry_safely(&source_path, &final_dest_path)?;

    Ok(())
}

/// Parcourt le dossier de corbeille (`trash/`) et renvoie la liste des éléments supprimés.
#[tauri::command]
pub fn get_trash_items(app: AppHandle) -> Result<Vec<InboxItem>, String> {
    let trash_dir = get_trash_dir(&app)?;
    let read_dir = fs::read_dir(&trash_dir)
        .map_err(|e| format!("Erreur lors de la lecture de la corbeille : {}", e))?;

    let mut items = Vec::new();

    for entry_res in read_dir {
        let entry = entry_res.map_err(|e| format!("Entrée corbeille illisible : {}", e))?;
        let path = entry.path();
        let metadata = fs::metadata(&path)
            .or_else(|_| entry.metadata())
            .map_err(|e| format!("Métadonnées corbeille illisibles : {}", e))?;

        let nom = entry.file_name().to_string_lossy().to_string();
        let est_dossier = metadata.is_dir();
        let taille = if est_dossier {
            0
        } else {
            fs::metadata(&path)
                .map(|m| m.len())
                .unwrap_or_else(|_| metadata.len())
        };
        let extension = if est_dossier {
            None
        } else {
            path.extension()
                .map(|ext| ext.to_string_lossy().to_string())
        };

        let date_modification = extract_modified_timestamp(&metadata);

        items.push(InboxItem {
            nom,
            taille,
            extension,
            date_modification,
            est_dossier,
        });
    }

    items.sort_by(|a, b| b.date_modification.cmp(&a.date_modification));

    Ok(items)
}

/// Supprime définitivement tout le contenu présent dans le dossier corbeille (`trash/`).
#[tauri::command]
pub fn empty_trash(app: AppHandle) -> Result<(), String> {
    let trash_dir = get_trash_dir(&app)?;
    let read_dir = fs::read_dir(&trash_dir)
        .map_err(|e| format!("Erreur lors de la lecture de la corbeille : {}", e))?;

    for entry_res in read_dir {
        let entry = entry_res.map_err(|e| format!("Entrée corbeille illisible : {}", e))?;
        let path = entry.path();
        if path.is_dir() {
            fs::remove_dir_all(&path)
                .map_err(|e| format!("Erreur lors de la suppression définitive du dossier {:?} : {}", path, e))?;
        } else {
            fs::remove_file(&path)
                .map_err(|e| format!("Erreur lors de la suppression définitive du fichier {:?} : {}", path, e))?;
        }
    }

    Ok(())
}
