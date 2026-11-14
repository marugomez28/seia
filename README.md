# SEIA — Sistema Automatizado de Búsqueda, Filtrado y Gestión de Procesos SECOP II

## 1. Descripción General
**SEIA** es una plataforma de dos capas conectada en tiempo real a **PostgreSQL en Supabase** y al endpoint público SODA de **Datos Abiertos de SECOP II** (`https://www.datos.gov.co/resource/jbjy-vk9h.json`):
- **`seia-app`**: Frontend construido con **Next.js (App Router)**, **TypeScript**, **CSS Modules**, físicas de resorte con **Framer Motion**, iconografía con **Lucide React** y notificaciones estilo Sileo con **Sonner**.
- **`seia-services`**: Backend API REST con **Node.js**, **Express** y **TypeScript**, conectado directamente a Supabase mediante `@supabase/supabase-js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`) y sincronizado con SECOP II mediante `secopFetcher.ts`.

---

## 2. Flujo de Datos Reales (Sin Datos Quemados)
1. **Tarea 1 — Conexión Real a Supabase (`parametros_busqueda`)**:
   - `seia-services/src/config/supabase.ts` inicializa `@supabase/supabase-js` con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
   - `seia-services/src/controllers/parametrosController.ts` ejecuta `SELECT`, `INSERT`, `UPDATE` y `DELETE` directamente sobre la tabla `parametros_busqueda` en Supabase.
   - `seia-app` consume `/api/parametros` sin arreglos estáticos locales.
2. **Tarea 2 — Sincronización Real con SECOP II (`secopFetcher.ts` y `procesos_secop`)**:
   - `seia-services/src/services/secopFetcher.ts` consulta primero los registros activos de `parametros_busqueda` en Supabase para obtener códigos UNSPSC, modalidades y palabras clave.
   - Realiza la petición con `axios` a `https://www.datos.gov.co/resource/jbjy-vk9h.json`, filtra los procesos coincidentes y ejecuta `upsert` en la tabla `procesos_secop` usando `uid_secop` para evitar duplicados.
   - El dashboard principal de `seia-app` consulta `/api/procesos` mostrando los contratos reales almacenados en `procesos_secop`.
