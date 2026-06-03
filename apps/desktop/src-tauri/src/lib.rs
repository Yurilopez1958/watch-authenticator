use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{Emitter, Manager};

#[derive(Default)]
struct WatcherState(Mutex<Option<RecommendedWatcher>>);

#[derive(Clone, Serialize)]
struct NitonFileEvent {
    path: String,
    kind: String,
}

/// Lee un fichero de texto y devuelve su contenido al frontend (parsing se hace en TS).
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Empieza a vigilar la carpeta de exports del software Niton (NDT/NitonConnect).
/// Cada vez que aparece o cambia un .csv, emite el evento "niton-file" al frontend
/// con la ruta, que entonces lo lee y parsea con @watch-auth/core.
#[tauri::command]
fn start_niton_watcher(
    folder: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let path = PathBuf::from(&folder);
    if !path.exists() {
        return Err(format!("La carpeta no existe: {}", folder));
    }

    let app_handle = app.clone();
    let mut watcher: RecommendedWatcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
        if let Ok(event) = res {
            let is_csv = event
                .paths
                .iter()
                .any(|p| p.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("csv")));
            if !is_csv {
                return;
            }
            let kind = match event.kind {
                EventKind::Create(_) => "create",
                EventKind::Modify(_) => "modify",
                EventKind::Remove(_) => "remove",
                _ => "other",
            };
            for p in event.paths {
                let payload = NitonFileEvent {
                    path: p.to_string_lossy().to_string(),
                    kind: kind.to_string(),
                };
                let _ = app_handle.emit("niton-file", payload);
            }
        }
    })
    .map_err(|e| e.to_string())?;

    let config = Config::default().with_poll_interval(Duration::from_secs(2));
    watcher.configure(config).map_err(|e| e.to_string())?;
    watcher
        .watch(&path, RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    *state.0.lock().unwrap() = Some(watcher);
    Ok(())
}

#[tauri::command]
fn stop_niton_watcher(state: tauri::State<'_, WatcherState>) -> Result<(), String> {
    *state.0.lock().unwrap() = None;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            start_niton_watcher,
            stop_niton_watcher
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error mientras corría la app tauri");
}
