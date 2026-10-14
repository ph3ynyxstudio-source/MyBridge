use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::time::UNIX_EPOCH;
use tauri::{AppHandle, Manager};

const INBOX_DIR_PATH: &str = r"C:\Ph3yNyx.OS\00-Dropbox";
const PROJECTS_DIR_NAME: &str = "projects";

/// Élément présent dans la Boîte de dépôt (`C:\Ph3yNyx.OS\00-Dropbox`).
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
    pub taille: u64,
    pub est_dossier: bool,
    pub enfants_optionnels: Option<Vec<ProjectFolder>>,
}

/// Résout et garantit l'existence de la Boîte de dépôt (`C:\Ph3yNyx.OS\00-Dropbox`)
/// et du coffre des projets sous `app_data_dir/projects/`.
pub fn init_storage_dirs(app: &AppHandle) -> Result<(PathBuf, PathBuf), String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Impossible de résoudre app_data_dir : {}", e))?;

    let inbox_dir = PathBuf::from(INBOX_DIR_PATH);
    let projects_dir = base_dir.join(PROJECTS_DIR_NAME);

    fs::create_dir_all(&inbox_dir).map_err(|e| {
        format!(
            "Impossible de créer le dossier Boîte de dépôt ({}) : {}",
            INBOX_DIR_PATH, e
        )
    })?;
    fs::create_dir_all(&projects_dir)
        .map_err(|e| format!("Impossible de créer le dossier projects/ : {}", e))?;

    Ok((inbox_dir, projects_dir))
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

/// Parcourt le dossier `inbox/` et renvoie la liste complète des éléments en attente.
#[tauri::command]
pub fn get_inbox_items(app: AppHandle) -> Result<Vec<InboxItem>, String> {
    let (inbox_dir, _) = init_storage_dirs(&app)?;

    let read_dir = fs::read_dir(&inbox_dir)
        .map_err(|e| format!("Erreur lors de la lecture de inbox/ : {}", e))?;

    let mut items = Vec::new();

    for entry_res in read_dir {
        let entry = entry_res.map_err(|e| format!("Entrée inbox illisible : {}", e))?;
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Métadonnées inbox illisibles : {}", e))?;

        let nom = entry.file_name().to_string_lossy().to_string();
        let est_dossier = metadata.is_dir();
        let taille = if est_dossier { 0 } else { metadata.len() };
        let extension = if est_dossier {
            None
        } else {
            entry
                .path()
                .extension()
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

    let valid_item = validate_single_name(&item_name, "item_name")?;
    let valid_project = validate_single_name(&target_project, "target_project")?;
    let valid_subpath = validate_relative_subpath(target_subpath)?;

    let source_path = inbox_dir.join(&valid_item);
    if !source_path.exists() {
        return Err(format!(
            "L'élément '{}' est introuvable dans la Boîte de dépôt.",
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

    let destination_path = target_dir.join(&valid_item);
    if destination_path.exists() {
        return Err(format!(
            "Action refusée : '{}' existe déjà dans le dossier cible (aucun écrasement silencieux).",
            valid_item
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
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Métadonnées illisibles : {}", e))?;

        let nom = entry.file_name().to_string_lossy().to_string();
        let est_dossier = metadata.is_dir();
        let taille = if est_dossier { 0 } else { metadata.len() };

        let rel_path = path
            .strip_prefix(project_root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");

        let enfants_optionnels = if est_dossier && include_immediate_children {
            read_directory_entries(&path, project_root, false).ok()
        } else {
            None
        };

        folders.push(ProjectFolder {
            nom,
            chemin_relatif: rel_path,
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
#[tauri::command]
pub fn read_project_contents(
    app: AppHandle,
    project_name: String,
    subpath: Option<String>,
) -> Result<Vec<ProjectFolder>, String> {
    let (_, projects_dir) = init_storage_dirs(&app)?;

    let valid_project = validate_single_name(&project_name, "project_name")?;
    let valid_subpath = validate_relative_subpath(subpath)?;

    let project_root = projects_dir.join(&valid_project);
    if !project_root.exists() || !project_root.is_dir() {
        return Err(format!(
            "Le projet '{}' est introuvable dans projects/.",
            valid_project
        ));
    }

    let target_dir = project_root.join(&valid_subpath);
    if !target_dir.exists() || !target_dir.is_dir() {
        return Err("Le dossier demandé n'existe pas dans ce projet.".to_string());
    }

    read_directory_entries(&target_dir, &project_root, true)
}

/// Crée un nouveau dossier de projet dans le coffre `projects/{project_name}`.
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
