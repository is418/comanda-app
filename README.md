# COMANDA — Panel de pedidos

Next.js (App Router) + TypeScript + Tailwind + Supabase (datos reales, Auth y Realtime).

## 1. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` (ya existe uno con la URL prellenada) y pon tu **anon key** real:

```
NEXT_PUBLIC_SUPABASE_URL=https://n8n-supabase2.ozxdks.easypanel.host
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

La encuentras en tu proyecto Supabase → **Project Settings → API → anon public key**.
Nunca pongas aquí la `service_role key` — esa da acceso total y nunca debe salir del servidor.

## 2. Crear el usuario del negocio (login)

En Supabase → **Authentication → Users → Add user**, crea la cuenta del dueño de la
taquería con su correo y una contraseña. Con eso ya puede entrar al panel — no hace
falta ningún flujo de registro público, el login solo acepta cuentas que tú crees ahí.

## 3. Instalar y correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — te va a mandar a `/login` si no hay sesión.

## 4. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel: **New Project** → importa el repo → Framework se detecta solo (Next.js).
3. En **Environment Variables** agrega las mismas dos variables de `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

No necesitas configuración adicional: no hay backend propio, todo pasa por Supabase.

## Qué cambia respecto al prototipo HTML

- Los botones **Aceptar / Rechazar / Marcar listo / Entregado** ahora sí actualizan
  la columna `estado` en Supabase (`nuevo` → `en_preparacion` → `listo` → `entregado`,
  o `cancelado` si se rechaza) y sellan `hora_tomado` / `hora_listo` / `hora_entregado`.
- Las **notas** se guardan en la columna `notas` de verdad.
- Todo el panel está detrás de **login con Supabase Auth** — sin sesión, redirige a `/login`.
- Los pedidos nuevos aparecen solos vía **Supabase Realtime**, sin necesidad de recargar.
- El botón "Simular pedido nuevo" y "Reiniciar demo" del prototipo se quitaron:
  ya no aplican porque los datos son reales.

## Nota sobre el tiempo promedio de preparación

El prototipo original arrancaba esa métrica con datos de muestra "semilla" para que
no se viera en cero. La versión real la calcula con los pedidos activos que tienen
`hora_tomado` y `hora_listo` — si aún no hay pedidos completados hoy, se muestra `—`.
Si más adelante quieres que sea "tiempo promedio de todo el día" en vez de solo los
pedidos activos, se puede ajustar la consulta para incluir también los `entregado`
de las últimas 24h — dime si lo prefieres así.

## Sobre negocio_id (multi-negocio a futuro)

No se agregó ninguna columna `negocio_id` todavía — con una sola cuenta no aporta
nada hoy. El día que quieras soportar varios negocios, se agrega esa columna y se
filtran los pedidos por el negocio ligado al usuario autenticado (`auth.uid()`);
no requiere rehacer la app.
