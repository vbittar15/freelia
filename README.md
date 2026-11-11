# Freelia · MVP

El espacio de trabajo para freelancers creativos y sus clientes.
Hecho con **Next.js 15**, **Supabase** (base de datos, usuarios, archivos y tiempo real) y **Tailwind CSS**.

## Qué incluye

**Vista del creativo** (`/panel`)
- **Inicio**: piezas por aprobar, próximas publicaciones, cambios pedidos y dinero por cobrar.
- **Clientes**: ficha por cliente, color, notas, enlace de invitación, archivar y eliminar.
- **Briefs**: crear briefs y recibir solicitudes de clientes (Nuevo → En proceso → Completado).
- **Parrilla**: calendario mensual y vista de lista, filtros por cliente y estado, subida de arte (imagen o video), envío a aprobación, comentarios y "marcar como publicado".
- **Cotizaciones**: ítems, total automático, consecutivo, envío al cliente, PDF y conversión a cuenta de cobro cuando el cliente la acepta.
- **Cuentas de cobro**: formato colombiano ("Debe a", valor en letras, datos bancarios, firma), estados Pendiente, Vencida y Pagada, y PDF.
- **Mensajes**: un chat en tiempo real por cliente.
- **Notificaciones** en tiempo real y **Perfil** (cédula/NIT, ciudad y datos bancarios para los documentos).

**Vista del cliente** (`/cliente`)
- Inicio con lo pendiente, **aprobar o pedir cambios** en las piezas, **solicitudes** nuevas, aceptar o rechazar **cotizaciones**, ver **cuentas de cobro**, **chat** y notificaciones.

**Seguridad**: cada creativo solo ve sus datos y cada cliente solo ve lo que le enviaron. Esto se controla en la base de datos con *Row Level Security*. El cliente nunca ve borradores.

---

## Cómo ponerla en línea (unos 20 minutos, sin programar)

### 1. Crea la base de datos en Supabase (gratis)
1. Entra a [supabase.com](https://supabase.com), crea una cuenta y luego un proyecto nuevo (región: *South America (São Paulo)*).
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y presiona **Run**. Debe decir *Success*. Repite con `supabase/002_invitaciones.sql`.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key

### 2. Sube el código a GitHub
1. Crea un repositorio en [github.com/new](https://github.com/new) (puede ser privado).
2. Sube esta carpeta, sin `node_modules`.

### 3. Publica en Vercel (gratis)
1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub, haz clic en **Add New → Project** e importa el repositorio.
2. En **Environment Variables** agrega:
   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key |
   | `NEXT_PUBLIC_SITE_URL` | la URL que te dé Vercel, p. ej. `https://freelia.vercel.app` |
3. Presiona **Deploy**.

### 4. Conecta Supabase con tu dominio
En Supabase, ve a **Authentication → URL Configuration**:
- **Site URL**: `https://freelia.vercel.app` (o tu dominio).
- **Redirect URLs**: agrega `https://freelia.vercel.app/auth/callback`.

> 💡 Para hacer pruebas rápidas puedes desactivar la confirmación por correo en **Authentication → Providers → Email → Confirm email**. Vuelve a activarla antes de lanzar.

### 5. Pruébala
1. Crea tu cuenta en `/registro`. Esa es la cuenta del creativo.
2. Crea un cliente con un correo tuyo diferente.
3. En la ficha del cliente copia su **enlace único** (o envíalo por WhatsApp o correo) y ábrelo en una ventana de incógnito para crear la cuenta del cliente.
4. Crea una pieza, envíala a aprobación y apruébala desde la cuenta del cliente. 🎉

---

## Desarrollo local (opcional)
```bash
npm install
cp .env.example .env.local   # pega tus claves de Supabase
npm run dev                  # http://localhost:3000
```

## Estructura
```
supabase/schema.sql        Base de datos, seguridad, notificaciones automáticas
src/app/(auth)/            Ingresar y registro
src/app/panel/             Vista del creativo (+ actions.ts con todas las acciones)
src/app/cliente/           Vista del cliente
src/components/            Componentes (logo, Lia, chat, editor de ítems, documentos PDF…)
src/app/globals.css        Colores y estilos de marca (cámbialos aquí)
```

## Personalizar la marca
Los colores están en `src/app/globals.css`, dentro de `@theme`. Cambia `--color-brand` por el azul exacto de tu manual y se actualiza toda la app. El logo y Lia están en `src/components/brand.tsx`.

## Próximos pasos sugeridos
- Asistente IA "Lia" (redactar copys, resumir briefs)
- Facturación electrónica DIAN (integración con Alegra o Siigo)
- Equipos (varios creativos en una agencia) y planes de pago
- Conexión con redes sociales para publicar directamente
- App móvil (PWA o React Native)
