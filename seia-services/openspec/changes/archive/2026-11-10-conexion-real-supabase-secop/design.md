# Design

## Context

SEIA elimina la capa de datos quemados en memoria tanto en el backend (`seia-services`) como en el frontend (`seia-app`) para operar de extremo a extremo con datos reales almacenados en PostgreSQL sobre Supabase y sincronizados desde el portal de Datos Abiertos de Colombia (`https://www.datos.gov.co/resource/jbjy-vk9h.json`).

## Goals / Non-Goals

**Goals:**
- Configurar `@supabase/supabase-js` en `seia-services/src/config/supabase.ts` utilizando `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Conectar `parametrosController.ts`, `procesosController.ts` y `historialController.ts` directamente con las tablas `parametros_busqueda`, `procesos_secop` e `historial_filtros` en Supabase.
- Implementar `secopFetcher.ts` para leer los parámetros activos (`codigo_unspsc`, `modalidad`, `palabras_clave`) desde `parametros_busqueda` en Supabase, consultar la API SODA de SECOP II y persistir los procesos en `procesos_secop` evitando duplicados mediante la clave única `uid_secop`.
- Actualizar `seia-app` para consumir exclusivamente los endpoints de `seia-services` sin datos quemados.

**Non-Goals:**
- Almacenamiento en memoria o datos semilla quemados en los controladores o en el cliente HTTP de Next.js.

## Decisions

- **Deduplicación por `uid_secop`**: La tabla `procesos_secop` define la columna `uid_secop VARCHAR(100) UNIQUE NOT NULL` y `secopFetcher.ts` utiliza `.upsert(procesosParaInsertar, { onConflict: "uid_secop" })` para garantizar idempotencia en cada sincronización.
- **Consulta SoQL combinada con criterios de `parametros_busqueda`**: `secopFetcher.ts` extrae todos los perfiles activos (`activo = true`) de la tabla `parametros_busqueda` en Supabase y construye cláusulas SoQL dinámicas que filtran por códigos UNSPSC, modalidades y palabras clave.

## Risks / Trade-offs

- **Configuración de variables de entorno**: Si `SUPABASE_URL` o `SUPABASE_ANON_KEY` no están configuradas en `.env`, el backend reporta claramente el error de configuración en español para facilitar el diagnóstico inmediato durante las pruebas.
