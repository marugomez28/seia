import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEIA | Inteligencia y Automatización de Procesos SECOP II",
  description:
    "Sistema automatizado de búsqueda, filtrado, monitoreo y gestión de procesos de contratación pública en SECOP II conectado a Supabase.",
};

export default function DisenoRaiz({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          expand={false}
          visibleToasts={4}
          closeButton
          toastOptions={{
            className: "sileoToast",
            duration: 4200,
          }}
        />
      </body>
    </html>
  );
}
