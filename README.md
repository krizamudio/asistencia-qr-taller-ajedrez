# Asistencia QR — rápido, bonito y sin líos 😎

Genera un QR, la banda lo escanea, pone su nombre y queda registrada. Ideal para talleres, clases o cualquier junta donde quieras checar asistencia sin tanto rollo.

**Lo esencial**
- Crea una sesión con QR que expira (por defecto 20 minutos).
- La banda registra su nombre desde el QR y queda guardada en la BD.
- Panel del profe: genera QR, ve historial, detalle de asistentes y exporta a CSV.
- BD: PostgreSQL con tablas `sesiones` y `asistencias`.

**Qué hace (en corto)**
- Genera QR dinámicos (cliente + servidor).
- Controla la expiración de la sesión para que nadie se cuele después.
- Normaliza el nombre a mayúsculas para que todo quede parejo.
- Exporta la lista de asistencias a CSV desde el panel.

**Stack y dependencias principales**
- Next.js (App Router) v16
- React 19
- PostgreSQL (`pg`)
- `qrcode` para generar QR
- `dotenv`, `uuid`
- `tailwindcss`

**Ponte en marcha**
1. Clona el repo y métete a la carpeta del proyecto.
2. Crea un archivo `.env.local` con tu conexión a Postgres (pon tus datos):

```
DATABASE_URL=postgres://usuario:password@host:puerto/base_de_datos
```

3. Instala dependencias (recomendado `pnpm`):

```
pnpm install
# o
npm install
```

4. Ejecuta el script que crea las tablas:

```
node scripts/setup-db.js
```

5. Arranca la app en modo desarrollo:

```
pnpm dev
# o
npm run dev
```

**Archivos chidos / a revisar**
- Panel / generador de QR: [src/app/page.js](src/app/page.js)
- Registro vía QR (alumnos): [src/app/asistencia/[id]/page.js](src/app/asistencia/[id]/page.js)
- API sesiones (crear / listar): [src/app/api/sesiones/route.js](src/app/api/sesiones/route.js)
- API sesión (detalle / registrar): [src/app/api/sesiones/[id]/route.js](src/app/api/sesiones/[id]/route.js)
- Conexión a DB: [src/lib/db.js](src/lib/db.js)
- Script para inicializar la BD: [scripts/setup-db.js](scripts/setup-db.js)

**Consejitos**
- Usa `pnpm` si lo tienes (hay `pnpm-lock.yaml`).
- Para cambiar cuánto dura el QR, edita `minutosExpiracion` en `src/app/api/sesiones/route.js`.
- Si querés, te agrego badges, un GIF demo o un `.env.example` listo para copiar.

¡Listo! Si querés que lo deje más chido (imágenes, GIFs o badges), dime y lo dejo niquelado ✨
