import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Lectura estricta de las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY
 * para conectar seia-services con la base de datos PostgreSQL en Supabase.
 */
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[SEIA Advertencia]: Las variables SUPABASE_URL y SUPABASE_ANON_KEY no están definidas en el archivo .env."
  );
}

/**
 * Instancia oficial del cliente de Supabase (@supabase/supabase-js)
 * configurada con SUPABASE_URL y SUPABASE_ANON_KEY.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder-seia.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export const supabaseClient = supabase;

/**
 * Verifica la conectividad real con la tabla parametros_busqueda en Supabase.
 */
export async function verificarEstadoSupabase(): Promise<{
  conectado: boolean;
  detalle: string;
}> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      conectado: false,
      detalle:
        "Faltan las variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY en .env.",
    };
  }

  const { error } = await supabase
    .from("parametros_busqueda")
    .select("id")
    .limit(1);

  if (error) {
    return {
      conectado: false,
      detalle: `Error al consultar Supabase: ${error.message}`,
    };
  }

  return {
    conectado: true,
    detalle: "Conexión activa y verificada con PostgreSQL en Supabase.",
  };
}
