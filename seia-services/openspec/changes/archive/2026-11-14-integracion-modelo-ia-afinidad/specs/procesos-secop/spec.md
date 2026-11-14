# Spec Delta

## ADDED Requirements

### Requirement: Calcular la afinidad de los procesos en vivo
El sistema SHALL incluir en cada proceso devuelto por `GET /api/procesos` el campo `afinidad_ia`, calculado por el modelo de afinidad sobre la descripción del proceso en el momento de la consulta, y SHALL indicar con `iaDisponible` si el modelo pudo evaluar los procesos.

#### Scenario: Procesos evaluados por el modelo en vivo
- **WHEN** el dashboard solicita `GET /api/procesos` y el servicio de inferencia está disponible
- **THEN** cada proceso incluye `afinidad_ia` con `puntaje`, `afin`, `nivel` y `terminos_clave`, y la respuesta incluye `iaDisponible: true`

#### Scenario: Ordenar por afinidad
- **WHEN** el cliente solicita `GET /api/procesos?ordenarPor=afinidad`
- **THEN** los procesos se devuelven ordenados de mayor a menor puntaje de afinidad

#### Scenario: Servicio de IA no disponible
- **WHEN** el dashboard solicita `GET /api/procesos` y el servicio de inferencia no responde
- **THEN** la respuesta tiene código HTTP 200 con los procesos de Supabase, `afinidad_ia: null` en cada proceso e `iaDisponible: false`
