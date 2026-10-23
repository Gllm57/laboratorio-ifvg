# Cuentas propias para Laboratorio IFVG

La app ya trae todo el código para tener cuentas: entrar con tu email (sin contraseña, con un código de 6 dígitos) y seguir el avance en el celular y en la PC. Solo falta crear el "servidor" donde se guardan las cuentas. Usamos **Supabase**, que es gratis para este uso.

## Cómo funciona

- **Login:** escribes tu email y te llega un código de 6 dígitos. Lo escribes en la app y quedas dentro. Si el email no existía, la cuenta se crea sola.
- **Progreso:** cada persona tiene una fila en la tabla `progress` con su progreso (lecciones, XP, ejercicios, sesiones y notas).
- **Seguridad:** las reglas RLS de `supabase/schema.sql` hacen que cada persona solo pueda leer y cambiar su propia fila. La clave "anon" que va en la app es pública por diseño; lo que protege los datos son esas reglas.
- **Sincronización:**
  - la app sube los cambios unos segundos después de cada avance;
  - trae los del otro dispositivo al abrirla o volver a ella, y cada minuto mientras está abierta;
  - si hay avances en los dos lados, los junta (no borra nada).
- **Sesiones reales importadas desde CSV:** se quedan en cada dispositivo porque pesan mucho.

## Estado actual

- ✅ Proyecto creado: `laboratorio-ifvg` (`heaenlyhsgnuahbgawnv`, región us-east-1).
- ✅ Tabla `progress` con RLS y sus 4 reglas (Supabase no marca avisos de seguridad).
- ✅ URL y clave pública puestas en `app/config.js`.
- ⏳ Pendiente en el panel: la **Site URL** (paso 4) y las **plantillas de email con el código** (paso 3). La herramienta de Supabase que uso no permite cambiarlas.
- La app también acepta el enlace del email: si lo tocas en lugar de escribir el código, entras igual (en el iPhone se abre en Safari).

## Paso a paso (unos 15 minutos)

### 1. Crear el proyecto
1. Entra en https://supabase.com y crea una cuenta (puedes usar GitHub).
2. **New project**. Rellénalo así:
   - nombre: `laboratorio-ifvg`;
   - región: la más cercana a ti, por ejemplo *South America (São Paulo)*;
   - contraseña de la base de datos: inventa una y guárdala. La app no la usa.
3. Espera 1 o 2 minutos a que el proyecto termine de crearse.

### 2. Crear la tabla
1. Menú izquierdo → **SQL Editor** → **New query**.
2. Pega todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**. Debe decir *Success*.

### 3. Que el email traiga el código (opcional)
Sin este paso ya puedes entrar: el email trae un **enlace** y la app lo acepta. El código solo hace falta si usas la app **instalada** en el iPhone, porque el enlace se abre en Safari y no dentro de la app.

Supabase solo deja editar las plantillas con un servidor de correo propio (SMTP). Con Gmail es gratis:
1. En tu cuenta de Google activa la **verificación en 2 pasos**.
2. Entra en https://myaccount.google.com/apppasswords, crea una contraseña de aplicación llamada `Supabase` y copia los 16 caracteres.
3. En Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**. Rellena:
   - Sender email: tu Gmail
   - Sender name: `Laboratorio IFVG`
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: tu Gmail
   - Password: la contraseña de aplicación
4. Guarda. Luego, en **Templates → Magic link or OTP**, cambia el cuerpo por:
   ```html
   <h2>Tu código</h2>
   <p>Escribe este código en la app para entrar:</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   <p>Caduca en una hora. Si no lo pediste, ignora este correo.</p>
   ```
5. Haz lo mismo en **Confirm sign up**.

### 4. Dirección de la app
1. **Authentication** → **URL Configuration**: https://supabase.com/dashboard/project/heaenlyhsgnuahbgawnv/auth/url-configuration
2. En **Site URL** pon `https://gllm57.github.io/laboratorio-ifvg/`.

### 5. Pasarme las dos claves
1. **Project Settings** → **API** (o *Data API* / *API Keys*).
2. Copia:
   - **Project URL**, algo como `https://abcdxyz.supabase.co`;
   - la clave **anon public** (empieza por `eyJ…`, o `sb_publishable_…` en proyectos nuevos).
3. Pásamelas y las pongo en `app/config.js`. También puedes pegarlas tú:
   ```js
   window.LAB_CONFIG = {
     supabaseUrl: 'https://abcdxyz.supabase.co',
     supabaseAnonKey: 'eyJ...',
   };
   ```
   **No** pegues nunca la clave `service_role` ni la secreta: esas dan acceso total.

### 6. Probar
1. Abre la app en GitHub Pages → **Progreso** → escribe tu email → **Enviarme un código**.
2. Escribe el código que te llegó → **Entrar**. Debe decir *Sincronizado*.
3. En la PC haz lo mismo con el mismo email: verás el mismo progreso.

## Límites del plan gratis

- **Emails:** el servicio de correo que trae Supabase envía muy pocos por hora y solo sirve para probar. Para más personas, configura un SMTP propio en **Authentication** → **Emails** → **SMTP Settings**. Por ejemplo, *Resend* es gratis hasta 3.000 correos al mes.
- **Pausa del proyecto:** si pasa una semana sin que nadie use la app, Supabase pausa el proyecto. Se reactiva desde el panel con un clic. Con uso diario no pasa.
- **Capacidad:** de sobra para este uso. Hasta 50.000 usuarios activos al mes y 500 MB de base de datos; cada progreso ocupa unos pocos KB.

## ¿Y la versión del enlace de Claude?

La versión que abres desde tu enlace de Claude sigue usando tu cuenta de Claude, sin hacer nada. Son dos "nubes" distintas. Para pasar el progreso de una a otra, usa la **copia de seguridad** de Progreso: copias el texto en una y lo pegas en la otra.

## Próximos pasos posibles

- **Entrar con Google:** se activa en **Authentication** → **Providers** → **Google** y con un botón en la app.
- **Ranking o retos entre amigos:** una tabla pública con la racha y la disciplina de cada uno.
- **Borrar mi cuenta** desde la app.
