# Spec Delta

## Purpose

Registra y consulta directamente en la tabla `historial_filtros` de Supabase la auditoría de cada ejecución de sincronización realizada por `secopFetcher.ts`.

## ADDED Requirements

### Requirement: Consultar historial real desde Supabase
El sistema SHALL proporcionar el endpoint `GET /api/historial` consultando directamente la tabla `historial_filtros` en Supabase ordenada por `fecha_ejecucion` descendente.

#### Scenario: Listado de ejecuciones almacenadas en Supabase
- **WHEN** el cliente solicita `GET /api/historial`
- **THEN** el servidor consulta `historial_filtros` en Supabase y retorna código HTTP 200 con los registros reales

### Requirement: Registrar y eliminar auditoria de filtros en Supabase
El sistema SHALL insertar en `historial_filtros` el resultado de cada sincronización y permitir su depuración mediante `DELETE /api/historial/:id`.

#### Scenario: Insercion de trazabilidad tras sincronizacion SECOP II
- **WHEN** `secopFetcher.ts` completa una sincronización o se envía `POST /api/historial`
- **THEN** el sistema inserta el registro en la tabla `historial_filtros` de Supabase con el conteo de procesos y tiempo de ejecución
