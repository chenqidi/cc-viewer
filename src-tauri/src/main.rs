// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{list_jsonl_files, read_file_content, get_default_claude_dir, select_project_root};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_jsonl_files,
            read_file_content,
            get_default_claude_dir,
            select_project_root,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
