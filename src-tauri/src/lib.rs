pub mod launcher;
pub mod storage;

use launcher::launch_external_app;
use storage::{
    copy_item, create_project, empty_trash, get_inbox_items, get_trash_items, init_storage_dirs,
    list_projects, move_inbox_item, move_item, move_to_trash, open_file_in_system,
    read_project_contents,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            init_storage_dirs(app.handle()).map_err(|err| {
                std::io::Error::new(std::io::ErrorKind::Other, err)
            })?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            get_inbox_items,
            move_inbox_item,
            list_projects,
            read_project_contents,
            open_file_in_system,
            launch_external_app,
            move_to_trash,
            copy_item,
            move_item,
            get_trash_items,
            empty_trash
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
