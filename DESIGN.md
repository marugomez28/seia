# DESIGN.md — Sistema de Diseño y Lenguaje Visual SEIA (Impeccable UI/UX)

## 1. Filosofía Estética
SEIA adopta una estética **Glassmorphism de Alta Gama** (cristal esmerilado arquitectónico sobre superficies oscuras neutras). El diseño transmite autoridad institucional, precisión analítica y serenidad visual.

## 2. Tipografía Exclusiva
- **Familia Tipográfica Única**: `"Century Gothic", CenturyGothic, AppleGothic, sans-serif`.
- **Escala Tipográfica y Ritmo Vertical**:
  - `2.0rem` (32px) — Títulos de vista principal (`letter-spacing: -0.02em`, `line-height: 1.2`).
  - `1.25rem` (20px) — Encabezados de sección y modales (`font-weight: 700`).
  - `0.9375rem` (15px) — Cuerpo de lectura principal y objetos contractuales (`line-height: 1.55`).
  - `0.8125rem` (13px) — Metadatos técnicos, códigos UNSPSC, NIT y referencias SECOP II.
  - `0.75rem` (12px) — Etiquetas de estado y cabeceras de tabla en mayúsculas con `letter-spacing: 0.06em`.

## 3. Sistema de Color y Superficies
- **Fondos Oscuros Neutros**:
  - Lienzo base (`--bg-canvas`): `#0b0c0e`
  - Superficie elevada (`--bg-elevated`): `#121418`
  - Cristal esmerilado primario (`--glass-surface`): `rgba(22, 25, 31, 0.72)`
  - Cristal esmerilado secundario (`--glass-subtle`): `rgba(28, 32, 40, 0.56)`
- **Textos y Contrastes**:
  - Texto primario (`--text-primary`): `#e1e1e1`
  - Texto secundario (`--text-secondary`): `#a5abb6`
  - Texto atenuado (`--text-muted`): `#6f7684`
- **Acento Institucional Exclusivo**:
  - Acento primario (`--accent-primary`): `#5c1219`
  - Acento en estado hover (`--accent-hover`): `#741821`
  - Superficie traslúcida de acento (`--accent-glass`): `rgba(92, 18, 25, 0.24)`
  - Borde destacado de acento (`--accent-border`): `rgba(92, 18, 25, 0.68)`

## 4. Propiedades Glassmorphism
- Desenfoque de fondo estándar: `backdrop-filter: blur(18px) saturate(140%)`.
- Bordes sutiles de cristal: `1px solid rgba(225, 225, 225, 0.08)`.
- Bordes activos o seleccionados: `1px solid #5c1219`.

## 5. Ritmo Espacial y Retícula
- Escala base estricta de **4px / 8px** (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).
- Radio de curvatura contenido y arquitectónico (`8px` para controles, `14px` para paneles de cristal, `18px` para modales).

## 6. Física de Movimiento (Framer Motion)
- Todas las transiciones emplean físicas de resorte (`type: "spring"`), nunca interpolaciones lineales:
  - Transición de paneles y vistas: `stiffness: 300, damping: 28, mass: 0.9`
  - Micro-interacciones y hover en tarjetas: `stiffness: 420, damping: 25`
  - Aparición de modales: `stiffness: 340, damping: 30`
- Cumplimiento de accesibilidad: respeto a `prefers-reduced-motion`.

## 7. Iconografía y Notificaciones
- Prohibición total de emojis en interfaz y código.
- Iconografía vectorial de trazo fino mediante `lucide-react`.
- Notificaciones apilables estilo Sileo mediante `sonner` con acabado de cristal esmerilado y borde lateral `#5c1219`.
