# Proposal

## Why

Para pasar de un prototipo arquitectónico a un sistema de producción real, SEIA requiere eliminar cualquier dato estático o quemado en memoria y operar exclusivamente contra las tablas reales de PostgreSQL en Supabase (`parametros_busqueda`, `procesos_secop`, `historial_filtros`) y el endpoint SODA de Datos Abiertos de SECOP II (`https://www.datos.gov.co/resource/jbjy-vk9h.json`).

## What Changes

- Configuración directa del cliente `@supabase/supabase-js` en `seia-services/src/config/supabase.ts` empleando `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Refactorización del controlador CRUD `parametrosController.ts` (`GET`, `POST`, `PUT`, `DELETE`) para interactuar de forma directa con la tabla `parametros_busqueda` en Supabase sin arreglos en memoria.
- Creación del servicio `seia-services/src/services/secopFetcher.ts` que consulta los perfiles activos en `parametros_busqueda` (códigos UNSPSC, modalidades y palabras clave), ejecuta la petición filtrada con `axios` hacia `https://www.datos.gov.co/resource/jbjy-vk9h.json` e inserta automáticamente los contratos en `procesos_secop` evitando duplicados mediante `uid_secop`.
- Actualización de `seia-app` (`apiClient.ts`, `page.tsx`, `GestorParametros.tsx`, `PanelProcesos.tsx`) eliminando todos los arreglos estáticos de respaldo para consumir exclusivamente los datos reales provenientes de `seia-services` y Supabase.

## Capabilities

### New Capabilities
- `parametros-busqueda`: Operaciones CRUD directas contra la tabla `parametros_busqueda` en Supabase PostgreSQL.
- `procesos-secop`: Sincronización real mediante `secopFetcher.ts` desde la API SODA de SECOP II y persistencia en `procesos_secop` con deduplicación por `uid_secop`.
- `historial-filtros`: Registro y consulta directa en Supabase de las ejecuciones de sincronización en `historial_filtros`.

### Modified Capabilities

## Impact

- `seia-services/src/config/supabase.ts`
- `seia-services/src/controllers/parametrosController.ts`
- `seia-services/src/controllers/procesosController.ts`
- `seia-services/src/controllers/historialController.ts`
- `seia-services/src/services/secopFetcher.ts`
- `seia-app/src/services/apiClient.ts` y vistas del dashboard principal en Next.js.
