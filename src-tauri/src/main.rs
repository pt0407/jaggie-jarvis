#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
struct MarkdownFile {
    name: String,
    path: String,
    content: String,
}

#[tauri::command]
fn scan_obsidian_vault(vault_path: String) -> Result<Vec<MarkdownFile>, String> {
    let path = Path::new(&vault_path);
    
    if !path.exists() {
        return Err(format!("Vault path does not exist: {}", vault_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Vault path is not a directory: {}", vault_path));
    }
    
    let mut files = Vec::new();
    
    for entry in WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();
        
        // Skip hidden files and .obsidian folder
        if entry_path.file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.starts_with('.'))
            .unwrap_or(false)
        {
            continue;
        }
        
        if entry_path.extension().and_then(|s| s.to_str()) == Some("md") {
            match fs::read_to_string(entry_path) {
                Ok(content) => {
                    let name = entry_path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("Untitled")
                        .to_string();
                    
                    let path_str = entry_path
                        .to_str()
                        .unwrap_or("")
                        .to_string();
                    
                    files.push(MarkdownFile {
                        name,
                        path: path_str,
                        content: content.chars().take(10000).collect(), // Limit to 10k chars
                    });
                }
                Err(e) => {
                    eprintln!("Failed to read file {:?}: {}", entry_path, e);
                }
            }
        }
    }
    
    Ok(files)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![scan_obsidian_vault])
        .setup(|app| {
            let handle = app.handle();
            
            // Create system tray with menu
            let menu = tauri::menu::MenuBuilder::new(handle)
                .item(&tauri::menu::MenuItem::with_id(handle, "show", "Show", true, None::<&str>)?)
                .item(&tauri::menu::MenuItem::with_id(handle, "quit", "Quit", true, None::<&str>)?)
                .build()?;
            
            let _tray = tauri::tray::TrayIconBuilder::new()
                .icon(handle.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => app.exit(0),
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(handle)?;

            // Hide dock icon on macOS for 24/7 background agent feel
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
