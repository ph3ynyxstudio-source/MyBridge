pub mod launcher;
pub mod storage;

use launcher::launch_external_app;
use storage::{
    archive_trash_items, compress_project_archive, convert_inbox_folder_to_project, copy_item,
    create_project, delete_project, delete_trash_items, empty_trash, get_archives_status,
    get_file_absolute_path, get_file_metadata, get_inbox_items, get_trash_items,
    get_undo_redo_status, import_external_path, init_storage_dirs, list_projects, move_inbox_item,
    move_item, move_to_trash, open_file_in_system, read_file_text, read_project_contents,
    redo_last_action, rename_item, rename_project, save_file_bytes, search_global,
    undo_last_action, write_text_file,
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            init_storage_dirs(app.handle()).map_err(|err| {
                std::io::Error::new(std::io::ErrorKind::Other, err)
            })?;
            if let Some(icon) = app.default_window_icon().cloned() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            convert_inbox_folder_to_project,
            rename_project,
            rename_item,
            delete_project,
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
            delete_trash_items,
            archive_trash_items,
            empty_trash,
            get_archives_status,
            compress_project_archive,
            get_file_absolute_path,
            read_file_text,
            get_file_metadata,
            write_text_file,
            import_external_path,
            save_file_bytes,
            get_undo_redo_status,
            undo_last_action,
            redo_last_action,
            search_global
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
