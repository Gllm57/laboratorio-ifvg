# Laboratorio IFVG

App web para aprender trading con la estrategia de un **bootcamp de trading** en YouTube: toma de liquidez + IFVG + objetivo claro, en la sesión de Nueva York AM (9:30–11:00) o en la asiática (20:00–21:30).

> Material educativo no oficial. Los gráficos de práctica y del simulador se generan por simulación; no son datos reales del mercado. Operar futuros con apalancamiento implica riesgo de pérdida.

## Qué incluye

La barra inferior tiene **Hoy**, **Aprender**, el botón central del **Simulador**, **Practicar** y **Progreso**.

- **Bienvenida** en 3 pasos la primera vez que abres la app.
- **Hoy**: tablero con tu nivel, la semana con los días que practicaste, la misión del día (lección, ejercicio recomendado y sesión simulada), racha, precisión y disciplina, preguntas antes de operar (descanso, calma y noticias), repaso de 2 minutos de lecciones pasadas con repetición espaciada y aviso para guardar una copia del progreso.
- **Aprender**: ruta de 50 días en 5 fases, dibujada como un camino con el día que toca resaltado. Cada día tiene teoría detallada por secciones con gráficos, ideas clave, errores comunes, un ejemplo resuelto, un control de 2 preguntas y un enlace para buscar el video. Incluye la ficha de la **estrategia** (los 3 pasos, horarios, los 3 modelos, el plan y un examen final) y un **glosario** con buscador.
- **Practicar**: 7 tipos de ejercicio evaluados (FVG, toma de liquidez, IFVG, stop, objetivo, modelo y cálculo de contratos), con el que más te cuesta marcado como recomendado.
- **Simulador** vela a vela de NQ o ES, en la sesión de Nueva York o de Asia, con datos simulados o con datos reales importados desde un CSV de TradingView. En el celular va a pantalla completa, con reproductor, stop y objetivo que se arrastran sobre el gráfico, checklist en vivo, contexto en 1H o 4H y temporalidades de 1m a 15m. La orden se confirma deslizando, para evitar entradas por un toque accidental. Al final da una nota de disciplina sobre 100, la línea de tiempo del trade, lo que hiciste bien, lo que debes mejorar (con enlaces a la lección y al ejercicio) y una repetición guiada paso a paso.
- **Mis notas**: apartado para guardar reglas, errores e ideas, con etiquetas (General, Lección, Trade, Idea), búsqueda, edición y borrado. Cada lección tiene un botón para anotar algo de ese día, y también se ven las notas escritas al terminar las sesiones del simulador.
- **Progreso**: nivel del 1 (Novato) al 5 (Experto), acierto por ejercicio, las reglas que más fallas, si operas el setup del plan, en qué franja y día entras, la curva en R y el diario de sesiones con tus notas.

## Cómo usarla

- **En línea**: https://gllm57.github.io/laboratorio-ifvg/ (con GitHub Pages activado en *Settings → Pages → Deploy from a branch → `main` / `(root)`*).
- **En local**: abre `app/index.html` en el navegador. No necesita servidor ni instalación.

El progreso se guarda en el `localStorage` del navegador.

En el teléfono, abre el enlace y usa *Añadir a pantalla de inicio*: la app se instala como una aplicación y funciona sin conexión.

## Cuenta y sincronización

- **Desde el enlace de Claude:** el progreso se guarda en tu cuenta de Claude y se sincroniza entre el celular y la PC.
- **En GitHub Pages:** cuentas propias con Supabase. Entras con tu email y un código de 6 dígitos. Se activan rellenando `app/config.js`; los pasos están en [CUENTAS.md](CUENTAS.md) y la tabla en [`supabase/schema.sql`](supabase/schema.sql).
- **Sin configurar:** el progreso queda en el dispositivo y la copia de seguridad permite moverlo.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `app/engine.js` | Generador de sesiones de 1m (NQ o ES, Nueva York o Asia), lector de CSV con datos reales, detectores (FVG, IFVG, swings, tomas de liquidez), agregación de temporalidades y evaluación de trades |
| `app/charts.js` | Gráficos de velas y de líneas en SVG |
| `app/content.js` | Las 50 lecciones, sus preguntas y el examen |
| `app/teoria1.js` … `teoria3.js` | Teoría ampliada de cada día: secciones, errores comunes y ejemplos |
| `app/sw.js`, `app/manifest.webmanifest` | Instalación en el teléfono y modo sin conexión |
| `app/icon.svg` y `app/*.png` | Logo de la app e iconos para iPhone y Android |
| `app/diagrams.js` | Diagramas de cada lección |
| `app/glosario.js` | Términos del glosario con el día donde se explican |
| `app/config.js` | Datos del proyecto de Supabase para las cuentas (vacío = sin cuentas) |
| `app/app.js` | Navegación, plan de hoy, progreso, prácticas, simulador, repetición guiada y estadísticas |
| `maqueta/` | Propuesta de rediseño: pantallas de Inicio, Simulador, Lección y Móvil (formato `.dc.html` del lienzo de diseño de Claude) |
