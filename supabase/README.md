# Supabase — esquema y seed

## Cómo aplicar las migraciones

### Opción A — Supabase Dashboard (más sencillo para empezar)

1. Crea un proyecto en https://supabase.com (region EU recomendada).
2. Ve a **SQL Editor** y ejecuta en orden:
   - `migrations/0001_initial_schema.sql`
   - `migrations/0002_seed_rolex.sql`
3. Ve a **Storage** y crea un bucket privado llamado `watch-photos`.
4. Copia las credenciales de **Settings → API** al fichero `.env` en la raíz del proyecto:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Opción B — Supabase CLI (recomendado a medida que el proyecto crezca)

```powershell
npm install -g supabase
supabase login
supabase link --project-ref <tu-project-ref>
supabase db push
```

## Estructura del esquema

```
brands ──┬─< models ──┐
         │            │
         └─< reference_profiles ──< reference_profile_elements
                       │
materials ─────────────┘

auth.users ──┬─< watches ──┬─< xrf_measurements ──< element_readings
             │             │             │
             │             │             └─< match_results
             │             │
             │             └─< photos
             └─< (RLS user_id en cada tabla)
```

## Notas

- **RLS** está activado en todas las tablas. El catálogo (brands, models, materials, reference_profiles) es de lectura para cualquier usuario autenticado. Los datos privados (watches, measurements, photos, match_results) solo son accesibles para su `user_id` dueño.
- Las **fotos** se guardan en el bucket `watch-photos`, bajo el prefijo `{user_id}/{watch_id}/{photo_id}.{ext}`. Configura las políticas de `storage.objects` para reflejar la misma restricción por user_id.
- Los **match_results** son una caché. Si cambian los perfiles de referencia, conviene invalidarlos y recalcular.
