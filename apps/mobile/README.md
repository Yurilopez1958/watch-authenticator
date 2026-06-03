# Watch Authenticator — App móvil

Cliente nativo iOS/Android construido con Expo SDK 52 + expo-router.

## Setup

```powershell
# desde la raíz del monorepo
pnpm install

# arrancar Metro
cd apps/mobile
pnpm start
```

Después escanea el QR con la app **Expo Go** (App Store / Play Store) o pulsa `a`/`i` en la terminal para abrir un emulador.

## Compartir código con la web

Las pantallas importan directamente desde `@watch-auth/core` — tipos, datos seed Rolex, algoritmo de match y utilidades de visión son los mismos que usa la app web. Solo cambia la capa de UI (React Native vs React DOM).

## Estructura

```
apps/mobile/
├── app.json              # config Expo
├── babel.config.js
├── metro.config.js       # resuelve packages/* del monorepo
├── tsconfig.json
└── app/                  # expo-router (file-based routing)
    ├── _layout.tsx       # Stack navigator
    ├── index.tsx         # Home
    ├── verificar.tsx     # Pantalla verificación XRF
    └── catalogo.tsx      # Catálogo Rolex
```

## Próximos pasos

- [ ] Auth con Supabase (sesión persistente con `expo-secure-store`)
- [ ] `expo-camera` para fotografiar partes clave del reloj
- [ ] Cache offline-first con `expo-sqlite`
- [ ] Importar CSV del Niton XL (Document Picker)
- [ ] Integración con Claude Vision desde el móvil
