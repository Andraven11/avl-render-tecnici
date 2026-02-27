#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::Engine;
use std::fs;
use std::io::Write;
use std::path::Path;

#[tauri::command]
fn save_export(
    folder_path: String,
    project_name: String,
    html_content: String,
    png_frontale: Option<String>,
    png_laterale: Option<String>,
    png_pianta: Option<String>,
) -> Result<String, String> {
    let sanitized = project_name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '_' || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>();
    let folder = Path::new(&folder_path).join(&sanitized);
    fs::create_dir_all(&folder).map_err(|e| e.to_string())?;

    let html_path = folder.join("viewer.html");
    fs::write(&html_path, html_content).map_err(|e| e.to_string())?;

    let decode_base64 = |s: &str| -> Result<Vec<u8>, String> {
        let data = s.replace("data:image/png;base64,", "");
        base64::engine::general_purpose::STANDARD
            .decode(&data)
            .map_err(|e| e.to_string())
    };

    if let Some(ref b64) = png_frontale {
        let bytes = decode_base64(b64)?;
        let mut f = fs::File::create(folder.join(format!("{}_FRONTALE.png", sanitized)))
            .map_err(|e| e.to_string())?;
        f.write_all(&bytes).map_err(|e| e.to_string())?;
    }
    if let Some(ref b64) = png_laterale {
        let bytes = decode_base64(b64)?;
        let mut f = fs::File::create(folder.join(format!("{}_LATERALE.png", sanitized)))
            .map_err(|e| e.to_string())?;
        f.write_all(&bytes).map_err(|e| e.to_string())?;
    }
    if let Some(ref b64) = png_pianta {
        let bytes = decode_base64(b64)?;
        let mut f = fs::File::create(folder.join(format!("{}_PIANTA.png", sanitized)))
            .map_err(|e| e.to_string())?;
        f.write_all(&bytes).map_err(|e| e.to_string())?;
    }

    Ok(folder.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![save_export])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
