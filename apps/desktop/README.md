# Watch Authenticator — App de escritorio

Cliente de escritorio para Windows / macOS / Linux construido con **Tauri 2**. Envuelve la app web Next.js (`@watch-auth/web`) en una ventana nativa y añade dos capacidades exclusivas:

1. **Watcher de carpeta Niton** — vigila el directorio donde el software oficial (NDT o NitonConnect) guarda los CSV con la opción "Also Save CSV", y emite un evento al frontend cada vez que aparece un fichero nuevo. La web app entonces lo parsea automáticamente y sube las mediciones a Supabase.
2. **Lectura nativa de ficheros** — comando Rust `read_text_file` sin las restricciones del navegador, útil para CSVs grandes.

## Requisitos para compilar

> **Importante:** Tauri necesita Rust + el toolchain MSVC en Windows. Estos no están instalados por defecto en el proyecto.

Instala una vez:

```powershell
# 1. Rust (incluye rustup, cargo, rustc)
winget install Rustlang.Rustup
# Reinicia el terminal después.

# 2. Microsoft C++ Build Tools (necesario para enlazar)
winget install Microsoft.VisualStudio.2022.BuildTools
# Selecciona la carga de trabajo "Desktop development with C++" en el instalador.

# 3. Tauri CLI (la dependencia ya está en package.json, pero la primera vez:)
cd apps/desktop
pnpm install
```

Verifica con:

```powershell
rustc --version   # debería ser >= 1.77
cargo --version
```

## Desarrollo

```powershell
# desde la raíz del monorepo
pnpm --filter @watch-auth/desktop dev
```

`tauri dev` arranca el servidor de Next.js (definido en `beforeDevCommand`) y abre la ventana nativa apuntando a `http://localhost:3000`.

## Build para producción

```powershell
pnpm --filter @watch-auth/desktop build
```

Genera el instalador en `apps/desktop/src-tauri/target/release/bundle/`.

## Estructura

```
apps/desktop/
├── package.json
└── src-tauri/
    ├── Cargo.toml
    ├── build.rs
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json     # permisos fs + dialog para el watcher
    ├── icons/               # iconos del bundle (pendiente)
    └── src/
        ├── main.rs
        └── lib.rs           # comandos read_text_file, start_niton_watcher, stop_niton_watcher
```

## Iconos

Tauri necesita iconos en `src-tauri/icons/`. Genera el set con:

```powershell
cd apps/desktop
pnpm tauri icon C:\ruta\a\logo.png
```

Hasta que añadas un logo, el bundle fallará. Para `tauri dev` con la ventana en marcha no son obligatorios.

## Próximos pasos

- [ ] Logo y set de iconos
- [ ] UI en la web app: pantalla "Conectar Niton" que invoca `start_niton_watcher` y reacciona al evento `niton-file`
- [ ] Cola de subida a Supabase con retry exponencial
- [ ] Auto-update con `tauri-plugin-updater`
