use std::path::Path;
use std::process::Command;

const VESPER_EXE: &str = r"C:\Program Files\vesper\vesper.exe";
const CHRONOSVERS_EXE: &str = r"C:\Program Files\chronosvers\chronosvers.exe";

/// Commande Tauri permettant de lancer les exécutables de l'écosystème PH3YNYX.OS.
/// Utilise un processus détaché (.spawn()) pour ne pas bloquer l'UI de MyBr|dge.
#[tauri::command]
pub fn launch_external_app(app_id: String) -> Result<(), String> {
    let (target_path, app_name) = match app_id.as_str() {
        "vesper" => (VESPER_EXE, "VespΣr"),
        "chronosvers" => (CHRONOSVERS_EXE, "Chr0nosV3rs"),
        _ => return Err(format!("Identifiant d'application non reconnu : '{}'", app_id)),
    };

    let path = Path::new(target_path);
    if !path.exists() {
        return Err(format!(
            "L'exécutable de {} est introuvable à l'emplacement prévu : {}",
            app_name, target_path
        ));
    }

    let mut cmd = Command::new(target_path);
    if let Some(parent) = path.parent() {
        cmd.current_dir(parent);
    }

    cmd.spawn().map_err(|err| {
        format!(
            "Échec du démarrage de {} ({}) : {}",
            app_name, target_path, err
        )
    })?;

    Ok(())
}
