# procesos-secop Specification

## Purpose
Gestiona la extracción real de procesos desde el endpoint SODA de Datos Abiertos de SECOP II (`https://www.datos.gov.co/resource/jbjy-vk9h.json`) mediante `secopFetcher.ts` y su persistencia en la tabla `procesos_secop` de Supabase evitando duplicados por `uid_secop`.

## Requirements

### Requirement: Sincronizar contratos reales con secopFetcher
El sistema SHALL implementar el servicio `secopFetcher.ts` que consulta los parámetros activos en `parametros_busqueda`, realiza la petición filtrada a `https://www.datos.gov.co/resource/jbjy-vk9h.json` por modalidades, códigos UNSPSC y palabras clave, e inserta los resultados en `procesos_secop` usando `uid_secop` como clave única de conflicto.

#### Scenario: Sincronizacion automatica basada en parametros activos
- **WHEN** se invoca `POST /api/procesos/sincronizar`
- **THEN** `secopFetcher` obtiene los parámetros activos de Supabase, consulta la API SODA de SECOP II, ejecuta `upsert` en `procesos_secop` con `onConflict: 'uid_secop'` y retorna los contratos reales sincronizados

### Requirement: Consultar procesos reales desde Supabase
El sistema SHALL exponer el endpoint `GET /api/procesos` que consulta directamente la tabla `procesos_secop` en Supabase aplicando filtros dinámicos de búsqueda, modalidad, departamento, estado y cuantía.

#### Scenario: Lectura de contratos reales en el dashboard
- **WHEN** el dashboard de `seia-app` solicita `GET /api/procesos`
- **THEN** el controlador consulta la tabla `procesos_secop` en Supabase y retorna código HTTP 200 con los contratos reales

### Requirement: Actualizar y eliminar procesos en Supabase
El sistema SHALL permitir actualizar el seguimiento interno (`PATCH /api/procesos/:id`) y eliminar registros (`DELETE /api/procesos/:id`) directamente en la tabla `procesos_secop` de Supabase.

#### Scenario: Actualizacion de estado interno y notas en Supabase
- **WHEN** el cliente envía `PATCH /api/procesos/:id` con `es_favorito`, `estado_interno` o `notas_analista`
- **THEN** el controlador actualiza la fila en `procesos_secop` y retorna código HTTP 200 con el proceso actualizado
