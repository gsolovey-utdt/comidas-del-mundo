# CLAUDE.md — Sabores del Mundo

## Comunicación

- Referirse al usuario como **Guillermo**

---

## Descripción del proyecto

**Sabores del Mundo** es una web app educativa y gamificada para niños/as. Muestra una comida (nombre + imagen) y el jugador tiene que elegir el país de origen entre 3 opciones. Tiene 3 niveles de dificultad (Fácil, Intermedio, Difícil), sistema de vidas, puntaje, feedback inmediato con dato curioso, y un mapa mundial que resalta el país correcto.

La app es completamente estática: no requiere build, bundler ni servidor. Se despliega en GitHub Pages.

**URL de producción:** https://gsolovey-utdt.github.io/comidas-del-mundo  
**Repositorio:** https://github.com/gsolovey-utdt/comidas-del-mundo

---

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `index.html` | Estructura de pantallas (inicio, juego, feedback, final). Linkea Google Fonts (Patrick Hand + Bangers). |
| `styles.css` | Estilos, responsive, animaciones. Variables de tema en `:root`. |
| `app.js` | Toda la lógica del juego |
| `data/foods.js` | Dataset editable de comidas (`window.FOODS_DATA`) |
| `data/image-map.json` | Mapeo auxiliar comida → imagen |
| `images/foods/` | Imágenes de las comidas (JPG 960×660, aspect 16:11) |
| `images/CREDITS.md` | Atribución de imágenes descargadas de fuentes externas (ej. Wikimedia Commons) |
| `vendor/jsvectormap/` | Librería local para el mapa mundial |

---

## Arquitectura

- **Sin frameworks.** Vanilla JS encapsulado en una IIFE.
- **Estado global** en el objeto `state` dentro de `app.js`.
- **Referencias DOM** centralizadas en el objeto `refs`.
- **Dataset** en `data/foods.js` como `window.FOODS_DATA` (array global).
- **Mapa** renderizado con `jsVectorMap` + mapa `world_merc`. El mapa se destruye y recrea en cada ronda de feedback.

---

## Constantes ajustables (`app.js`)

| Constante | Descripción | Valor actual |
|-----------|-------------|--------------|
| `ROUNDS_PER_LEVEL` | Rondas por nivel | 10 |
| `POINTS_PER_HIT` | Puntos por acierto | 10 |
| `LEVEL_ORDER` | Orden de niveles | `["easy", "medium", "hard"]` |
| `COUNTRY_META` | ISO + coordenadas por país | ver `app.js` |
| `SMALL_COUNTRY_CODES` | Países marcados con pin en vez de región coloreada | `KR, GB, IE, PT, BE, NL, UY, SV, CR, IL` |

---

## Dataset (`data/foods.js`)

Cada objeto en `FOODS_DATA` tiene:

| Campo | Descripción |
|-------|-------------|
| `food_name` | Nombre de la comida |
| `country` | País correcto (debe coincidir con una clave normalizada en `COUNTRY_META`) |
| `type` | Siempre `"country"` por ahora |
| `food_familiarity` | Familiaridad base: `"easy"`, `"medium"` o `"hard"` |
| `image` | Ruta relativa a la imagen (`images/foods/...`) |
| `fun_fact` | Dato curioso principal |
| `extra_fun_facts` | Array de datos curiosos adicionales |
| `distractors` | Objeto con claves `easy`, `medium`, `hard`; cada una es un array de 2 países |
| `notes` | Notas internas (no se muestran en el juego) |

**Nota importante:** el campo `country` debe normalizarse a una clave existente en `COUNTRY_META` para que el mapa se renderice. La normalización elimina tildes, pasa a minúsculas y colapsa espacios. Si se agrega un país nuevo, hay que añadirlo también en `COUNTRY_META` con su código ISO y coordenadas.

---

## Agregar una comida nueva

1. Agregar objeto en `data/foods.js` con todos los campos.
2. Completar los 3 niveles de `distractors`.
3. Copiar imagen en `images/foods/` y referenciarla en `image`.
4. Si el país no está en `COUNTRY_META`, agregarlo en `app.js` con código ISO y coords.
5. Si el país es visualmente pequeño en el mapa, agregar su ISO a `SMALL_COUNTRY_CODES`.

---

## Agregar un país nuevo al mapa

En `app.js`, agregar una entrada en `COUNTRY_META`:
```js
"nombre normalizado": { iso: "XX", coords: [lat, lng] }
```
El nombre normalizado es el `country` del dataset sin tildes, en minúsculas.

---

## Estética visual

La app tiene estética **cómic / pop-art** inspirada en juegos infantiles tipo wordwall.net. Implementada solo en `styles.css` (sin tocar `app.js` ni el markup, excepto el `<link>` de Google Fonts en `index.html`).

**Variables clave en `styles.css :root`:**

| Variable | Uso |
|----------|-----|
| `--ink-black` | `#1a1a1a` — color de bordes y texto principal en botones |
| `--sticker-shadow` | `3px 3px 0 var(--ink-black)` — sombra desplazada estilo sticker |
| `--font-hand` | `"Patrick Hand"` — fuente manuscrita para botones, badges, texto general |
| `--font-display` | `"Bangers"` — fuente comic comprimida para títulos, nombre de comida, badge |
| `--primary` | `#ff8c42` — naranja del botón primario |

**Patrón visual:** elementos interactivos (botones de respuesta, pills del header, imagen, badges) llevan `border: 3px solid var(--ink-black)` + `box-shadow: var(--sticker-shadow)`. Al hover la sombra se agranda ligeramente; al active se contrae (efecto press).

**Fondo:** halftone dots discretos (`radial-gradient` 1.4px cada 18px) sobre el degradado original `--bg-top` → `--bg-bottom`.

**Feedback badge:** `::before` con `content: "✓"` o `"✗"` en círculo verde/rojo. Las clases `.feedback-badge.good` y `.feedback-badge.bad` controlan color y símbolo.

**Mobile (≤ 560px):** media query agresivo que reduce padding del card, tamaño de imagen, alturas de botones, badge y mapa para que cada pantalla (inicio, juego, feedback, final) entre **completa sin scroll** en viewports desde 320×568 (iPhone SE 1) hasta 390×844 (iPhone 13+). En mobile los bordes pasan de 3px → 2px para no comer espacio.

---

## Decisiones tomadas

| Fecha | Decisión | Motivo |
|-------|----------|--------|
| 2026-04 | Librería de mapa en `vendor/` (local) | Evitar dependencia de CDN externo en Pages |
| 2026-04 | `destroy()` antes de limpiar `innerHTML` | jsVectorMap lanza error si intenta destruir nodos ya eliminados del DOM |
| 2026-04 | Países pequeños con pin en lugar de región coloreada | Algunos ISOs son difíciles de ver en la proyección Mercator a escala mundial |
| 2026-05 | Schnitzel y Strudel se clasifican como Alemania (no Austria) | Decisión del producto: aunque su origen es austríaco, la asociación cultural en Argentina es alemana. Austria queda como distractor en el nivel difícil. |
| 2026-05 | Imágenes nuevas se descargan de Wikimedia Commons | Licencia libre y trazable; atribución obligatoria en `images/CREDITS.md` |
| 2026-05 | Estética cómic/pop-art (fuentes manuscritas + bordes negros + stickers de feedback) | Inspirada en juegos infantiles tipo wordwall.net; usa Google Fonts (requiere conexión la primera vez) |
| 2026-05 | Mobile debe caber sin scroll en todas las pantallas | UX: micro-scroll en mobile es muy molesto. Media query ≤560px ajusta paddings, alturas e iconografía para garantizarlo desde 320×568 hasta 390×844. |

---

## Bugs conocidos / resueltos

- **[Resuelto]** Mapas a partir de la segunda ronda no se renderizaban: `destroy()` se llamaba después de `innerHTML = ""`, lo que causaba un error capturado por el `catch`. Fix: invertir el orden.

---

## Estado actual

**Fase:** Producción / v1.1 live  
App desplegada en GitHub Pages. Dataset con **48 comidas** de 21 países (5 alemanas tras la iteración de mayo 2026). Estética cómic/pop-art aplicada en mayo 2026.

---

## Notas para Claude

- No hay build. Para testear, basta abrir `index.html` en el navegador (o servir con `python -m http.server 8765 --directory <root>` si se necesita un server HTTP).
- El deploy es automático al pushear a `main` (GitHub Pages).
- Los datos están en `data/foods.js`, no en JSON, para poder usar `window.FOODS_DATA` sin servidor.
- `normalizeCountry()` en `app.js` es la función de lookup: elimina tildes, minúsculas, colapsa espacios. Cualquier país nuevo en el dataset debe pasar esa normalización para matchear con `COUNTRY_META`.
- Las imágenes en `images/foods/` están normalizadas a **960×660** (aspect 16:11). Al agregar una nueva, recortar al mismo aspect (la CSS hace `object-fit: contain`, así que una imagen con aspect distinto va a tener bandas blancas).
- Si el navegador de preview muestra una versión vieja del CSS tras editar `styles.css`, forzar reload del stylesheet via JS (cambiar `link.href` con un query param `?v=Date.now()`) o reiniciar el server de preview.
