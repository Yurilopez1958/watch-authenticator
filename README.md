# Watch Authenticator

Cross-platform app (mobile + web + desktop) for authenticating watches via:

1. **Metal composition analysis** with the Thermo Scientific Niton XL Precious Metal XRF spectrometer, comparing against a reference database by brand/model/year.
2. **Reference photo gallery** of key parts (movement, hands, logo, crown, dial, serial number) per model.
3. **Assisted visual analysis** with Claude Vision (describes discrepancies) and CLIP embeddings (finds the most similar reference photos).

MVP focused on Rolex; open architecture to add Patek Philippe, Audemars Piguet, and others.

## Monorepo layout

```
watch-authenticator/
├── packages/
│   ├── core/    # Types, match algorithm, seed data, AI integrations
│   └── db/      # Supabase client and generated types
└── apps/
    ├── web/     # Next.js (also packaged as a PWA)
    ├── mobile/  # React Native + Expo (iOS + Android)
    └── desktop/ # Tauri 2 (wraps the web app)
```

## Stack

- **Language:** TypeScript
- **Workspace:** pnpm workspaces
- **Backend:** Supabase (PostgreSQL + auth + storage) with offline-first local cache
- **Mobile:** React Native + Expo SDK 52
- **Web:** Next.js 15 (App Router) + Tailwind
- **Desktop:** Tauri 2 (Rust)
- **Vision AI:** Claude Vision API (Anthropic) + CLIP embeddings

## Setup

```powershell
pnpm install
cp .env.example .env   # fill in Supabase and Anthropic keys
pnpm dev               # start all apps in parallel
```

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm build` | Build every package and app |
| `pnpm dev` | Development mode in parallel |
| `pnpm test` | Run tests across packages |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm lint` | Lint every package |

## Project phases

- **MVP (current):** manual XRF entry, Rolex catalog, reference gallery, tolerance-based match, Claude Vision.
- **Phase 2:** Niton XL file import, CLIP embeddings, direct Bluetooth connection to Niton XL (pending Thermo Scientific SDK).
- **Phase 3:** custom on-device classifier, OCR of serial numbers, additional brands.
