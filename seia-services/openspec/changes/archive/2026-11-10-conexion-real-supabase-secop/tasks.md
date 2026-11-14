# Tasks

## 1. Tarea 1: Conexion Real a Supabase en Backend y Frontend

- [x] 1.1 Configurar cliente `@supabase/supabase-js` en `seia-services/src/config/supabase.ts` usando `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- [x] 1.2 Modificar `parametrosController.ts` (`GET`, `POST`, `PUT`, `DELETE`) para interactuar directamente con la tabla `parametros_busqueda` en Supabase
- [x] 1.3 Actualizar `seia-app` (`apiClient.ts`, `page.tsx`, `GestorParametros.tsx`) eliminando datos quemados para mostrar los parámetros reales desde `seia-services`

## 2. Tarea 2: Conexion a la API de SECOP II (Datos Abiertos SODA)

- [x] 2.1 Crear el servicio `seia-services/src/services/secopFetcher.ts` conectado a `https://www.datos.gov.co/resource/jbjy-vk9h.json`
- [x] 2.2 Consultar `parametros_busqueda` en Supabase para obtener códigos UNSPSC, modalidades y palabras clave activas
- [x] 2.3 Filtrar procesos en la petición a SECOP II e insertar resultados en `procesos_secop` evitando duplicados con `uid_secop`
- [x] 2.4 Actualizar el dashboard principal de Next.js para leer y mostrar los contratos reales de `procesos_secop` a través de la API Express
