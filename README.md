# Laboratorio IFVG

App web para aprender trading con la estrategia de un **bootcamp de trading** en YouTube: toma de liquidez + IFVG + objetivo claro, en la sesión de Nueva York AM (9:30–11:00) o en la asiática (20:00–21:30).

> Material educativo no oficial. Los gráficos de práctica y del simulador se generan por simulación; no son datos reales del mercado. Operar futuros con apalancamiento implica riesgo de pérdida.

## Qué incluye

- **Bienvenida** en 3 pasos la primera vez que abres la app.
- **Ruta de 50 días** en 5 fases. Cada día tiene teoría detallada por secciones con gráficos, ideas clave, errores comunes, un ejemplo resuelto y un control de 2 preguntas.
- **Estrategia**: los 3 pasos, los horarios, los 3 modelos (manipulación, continuación y retroceso), el plan de trading y un examen final.
- **Práctica evaluada**: 7 tipos de ejercicio (FVG, toma de liquidez, IFVG, stop, objetivo, modelo y cálculo de contratos).
- **Simulador** de sesiones de NQ vela a vela: en el celular a pantalla completa, con reproductor, stop y objetivo que se arrastran sobre el gráfico, checklist en vivo, contexto en 1H o 4H y temporalidades de 1m a 15m. Al final da una nota de disciplina sobre 100.
- **Diario** con la curva en R y tus notas.
- **Niveles** del 1 (Novato) al 5 (Experto).

## Cómo usarla

- **En línea**: https://gllm57.github.io/laboratorio-ifvg/ (con GitHub Pages activado en *Settings → Pages → Deploy from a branch → `main` / `(root)`*).
- **En local**: abre `app/index.html` en el navegador. No necesita servidor ni instalación.

El progreso se guarda en el `localStorage` del navegador.

En el teléfono, abre el enlace y usa *Añadir a pantalla de inicio*: la app se instala como una aplicación y funciona sin conexión.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `app/engine.js` | Generador de sesiones de 1m, detectores (FVG, IFVG, swings, tomas de liquidez), agregación de temporalidades y evaluación de trades |
| `app/charts.js` | Gráficos de velas y de líneas en SVG |
| `app/content.js` | Las 50 lecciones, sus preguntas y el examen |
| `app/teoria1.js` … `teoria3.js` | Teoría ampliada de cada día: secciones, errores comunes y ejemplos |
| `app/sw.js`, `app/manifest.webmanifest` | Instalación en el teléfono y modo sin conexión |
| `app/icon.svg` y `app/*.png` | Logo de la app e iconos para iPhone y Android |
| `app/diagrams.js` | Diagramas de cada lección |
| `app/app.js` | Navegación, progreso, prácticas, simulador y diario |
| `maqueta/` | Propuesta de rediseño: pantallas de Inicio, Simulador, Lección y Móvil (formato `.dc.html` del lienzo de diseño de Claude) |
