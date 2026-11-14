# parametros-busqueda Specification

## Purpose
Proporciona operaciones CRUD directas contra la tabla real `parametros_busqueda` en Supabase PostgreSQL a través de la API REST de Express para administrar perfiles de búsqueda automatizada de contratos en SECOP II.

## Requirements

### Requirement: Listar perfiles de parametros desde Supabase
El sistema SHALL exponer el endpoint `GET /api/parametros` consultando directamente la tabla `parametros_busqueda` en Supabase mediante `@supabase/supabase-js` y ordenando por `fecha_creacion` descendente.

#### Scenario: Consulta exitosa de parametros en base de datos
- **WHEN** el cliente envía una petición `GET /api/parametros`
- **THEN** el controlador ejecuta `supabase.from('parametros_busqueda').select('*')` y responde con código HTTP 200 y los registros reales almacenados

### Requirement: Crear nuevo parametro de busqueda en Supabase
El sistema SHALL permitir el registro de un nuevo perfil de búsqueda mediante `POST /api/parametros` insertando directamente en la tabla `parametros_busqueda` de Supabase.

#### Scenario: Insercion exitosa en tabla parametros_busqueda
- **WHEN** el cliente envía `POST /api/parametros` con `nombre_perfil`, `codigo_unspsc`, `modalidad` y `palabras_clave`
- **THEN** el controlador inserta el registro en Supabase y retorna código HTTP 201 con la fila creada

#### Scenario: Rechazo por ausencia de nombre de perfil
- **WHEN** el cliente envía `POST /api/parametros` sin el campo obligatorio `nombre_perfil`
- **THEN** el servidor responde con código HTTP 400 y mensaje de validación en español

### Requirement: Actualizar y eliminar parametro en Supabase
El sistema SHALL permitir modificar un registro existente mediante `PUT /api/parametros/:id` y eliminarlo mediante `DELETE /api/parametros/:id` operando directamente sobre `parametros_busqueda` en Supabase.

#### Scenario: Actualizacion directa de parametro por identificador
- **WHEN** el cliente envía `PUT /api/parametros/:id` con campos actualizados
- **THEN** el controlador ejecuta `.update()` en Supabase filtrando por `id` y retorna código HTTP 200 con el registro actualizado

#### Scenario: Eliminacion directa de parametro por identificador
- **WHEN** el cliente envía `DELETE /api/parametros/:id`
- **THEN** el controlador ejecuta `.delete()` en Supabase filtrando por `id` y retorna código HTTP 200 confirmando la eliminación
