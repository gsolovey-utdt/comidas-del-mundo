# CLAUDE.md — Comidas del Mundo

## Comunicación

- Referirse al usuario como **Guillermo**

---

## Descripción del proyecto

**Comidas del Mundo** es una web app educativa y gamificada para niños/as. Muestra una comida (nombre + imagen) y el jugador tiene que elegir el país de origen entre 3 opciones. Tiene 3 niveles de dificultad (Fácil, Intermedio, Difícil), sistema de vidas, puntaje, feedback inmediato con dato curioso, y un mapa mundial que resalta el país correcto.

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
| `data/foods.js` | **Generado** por `scripts/build_foods.py`. Es lo que carga la app (`window.FOODS_DATA`). No editar a mano. |
| `data/foods.csv` | Fuente de verdad del dataset. Mantenida en Google Sheets y exportada/descargada como CSV. |
| `data/image-map.json` | Mapeo auxiliar comida → imagen |
| `scripts/build_foods.py` | Lee `data/foods.csv` (o una URL de Sheets publicado) y regenera `data/foods.js` con validación. |
| `scripts/foods_to_csv.py` | Bootstrap one-shot: vuelca `data/foods.js` a `data/foods.csv`. Útil sólo para arrancar la planilla. |
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

## Dataset

**Fuente de verdad: Google Sheets → `data/foods.csv` → `data/foods.js` (generado).**

`data/foods.js` ya no se edita a mano. Se edita en una planilla de Google Sheets, se descarga/publica como CSV, y `scripts/build_foods.py` lo convierte al formato que carga la app.

### Columnas del CSV

| Columna | Descripción |
|---------|-------------|
| `food_name` | Nombre de la comida |
| `country` | País correcto (debe normalizar a una clave de `COUNTRY_META` en `app.js`) |
| `image` | Ruta relativa a la imagen (`images/foods/...`) |
| `fun_fact` | Dato curioso |
| `distractors_easy` | 2 países separados con ` \| ` |
| `distractors_medium` | 2 países separados con ` \| ` |
| `distractors_hard` | 2 países separados con ` \| ` |

El separador es **pipe** (`|`) con espacios opcionales alrededor. Se eligió porque los `fun_facts` ya usan `,` y `;` con frecuencia.

### Validaciones que hace `build_foods.py`

- Cada `country` (correcto) normaliza a una clave de `COUNTRY_META` en `app.js`. Si no está, el script falla pidiendo agregar el país.
- Cada `distractors_*` tiene exactamente 2 elementos.
- Ningún distractor es igual al país correcto.
- Si una imagen del campo `image` no existe en disco, sale un warning (no falla).

### Workflow recomendado

1. **Una sola vez:** importar `data/foods.csv` a un Google Sheet nuevo (Archivo → Importar → Subir → Reemplazar hoja actual, separador "coma"). Usar UTF-8.
2. Editar en Sheets como cualquier planilla.
3. Para llevar los cambios al repo, dos opciones equivalentes:
   - **Descargar:** Archivo → Descargar → CSV → reemplazar `data/foods.csv` localmente.
   - **Publicar:** Archivo → Compartir → Publicar en la web → CSV → copiar URL → guardar la URL una vez (ver más abajo).
4. Regenerar `foods.js`:
   ```bash
   # con archivo local (default lee data/foods.csv)
   python scripts/build_foods.py

   # con URL de Sheets publicado
   python scripts/build_foods.py "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"

   # dry-run (sólo valida)
   python scripts/build_foods.py --dry-run
   ```
5. Commitear `data/foods.csv` y `data/foods.js` juntos y pushear.

**Importante:** `data/foods.js` empieza con un comentario `// AUTO-GENERADO`. Si alguien lo edita a mano, el cambio se va a perder en el próximo build. Todo cambio de dataset va en el Sheet → CSV.

---

## Agregar una comida nueva

1. Agregar una fila en el Google Sheet con todos los campos (ver tabla arriba).
2. Completar los 3 niveles de distractors (2 países cada uno, separados con ` | `).
3. Copiar imagen en `images/foods/` y referenciarla en `image`.
4. Si el país correcto no está en `COUNTRY_META`, agregarlo en `app.js` con código ISO y coords (ver sección siguiente).
5. Si el país es visualmente pequeño en el mapa, agregar su ISO a `SMALL_COUNTRY_CODES`.
6. Bajar el CSV actualizado y correr `python scripts/build_foods.py`.

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

## Supabase

**Proyecto:** `irryksaoygdklwtsjsru` (compartido con `two-armed-bandit`)  
**Schema SQL:** [`supabase/schema.sql`](supabase/schema.sql) — correr una vez en el SQL editor de Supabase.

### Tablas

| Tabla | Contenido |
|-------|-----------|
| `sdm_sessions` | Una fila por partida: `session_id` (UUID), `player_country`, `start_level` |
| `sdm_answers` | Una fila por respuesta (incluye comodines): tiempos de reacción, `is_wildcard`, `wildcard_type` |
| `sdm_final_writeups` | Texto creativo final (opcional) |

- **Cliente:** UMD vía CDN (`async` para no bloquear scripts diferidos). Inicialización lazy: `getDb()` crea el cliente la primera vez que se necesita.
- **Estrategia:** fire-and-forget con `saveQuiet()`. Si Supabase no está disponible (offline, CDN lento), el juego continúa sin interrupciones.
- **RLS:** `anon_insert` policies en las 3 tablas. Sólo inserts desde el browser anónimo.
- **session_id:** `crypto.randomUUID()` en memoria, no persiste entre recargas.

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
| 2026-05 | El dataset se edita en Google Sheets, no en `foods.js` | Editar JSON-en-JS a mano es incómodo y propenso a errores de comillas/comas. `data/foods.csv` es la fuente de verdad; `scripts/build_foods.py` regenera `foods.js` con validación. Se eligió la variante "build local + commitear ambos archivos" sobre "fetch en runtime" para que la app siga siendo 100% estática y sin dependencias externas. |
| 2026-05 | Banderas como emoji Unicode en `COUNTRY_META` | Funcionan sin assets extra en todos los navegadores modernos. Cada entrada de `COUNTRY_META` tiene `flag`, `name`, `iso`, `coords`. |
| 2026-05 | Comodín sólo cuando vidas ∈ {1,2}, probabilidad 20% | Si el jugador tiene 3 vidas no necesita ayuda; si tiene 0 ya perdió. P=20% da una oportunidad razonable sin interrumpir demasiado. |
| 2026-05 | Supabase `async` (no `defer`) para el CDN | CDN lento bloquea todos los scripts `defer` siguientes. Con `async` el script carga en paralelo sin bloquear `app.js`. El cliente se inicializa lazily con `getDb()`. |
| 2026-05 | `app.js?v=N` en el script tag | Fuerza cache-bust del browser en actualizaciones; incrementar `N` al deployar cambios significativos. |
| 2026-05 | Imágenes con `object-fit: cover` | Decisión Guillermo: la imagen siempre llena la caja sin bandas blancas. El precio es que imágenes que no sean exactamente 16:11 quedan recortadas desde los bordes. La regla para futuras comidas: respetar el aspect 960×660 (16:11) al recortar. Si por alguna razón hay que aceptar una imagen con otro aspect, ajustar `object-position` puntualmente. |
| 2026-05 | Desktop: caja fija 900×680 (`min(900px,92vw)` × `min(680px,92vh)`) igual en las 6 pantallas | Replica el patrón mobile (que ya tenía caja fija) para desktop. El criterio fue: mismo tamaño en `start` / `game` / `feedback` / `levelup` / `wildcard` / `final`, centrado en viewport, sin scroll de página, con espacio en blanco interno si el contenido es chico. Vive en `@media (min-width: 561px)` para no interferir con el bloque mobile (`max-width: 560px`). |

---

## Pendientes

_(ninguno por ahora)_

---

## Bugs conocidos / resueltos

- **[Resuelto]** Mapas a partir de la segunda ronda no se renderizaban: `destroy()` se llamaba después de `innerHTML = ""`, lo que causaba un error capturado por el `catch`. Fix: invertir el orden.

---

## Estado actual

**Fase:** Producción / v1.2 (pendiente deploy)  
App desplegada en GitHub Pages. Dataset con **48 comidas** de **31 países**. En mayo 2026 se agregaron: banderas emoji en botones y mapa, dropdown de país del jugador, pantalla animada de transición de nivel, comodín de vidas (bandera→país o descripción→comida), medición de tiempos de respuesta con Supabase, y texto creativo al final.

---

## Notas para Claude

- No hay build. Para testear, basta abrir `index.html` en el navegador (o servir con `python -m http.server 8765 --directory <root>` si se necesita un server HTTP).
- El deploy es automático al pushear a `main` (GitHub Pages).
- Los datos están en `data/foods.js`, no en JSON, para poder usar `window.FOODS_DATA` sin servidor.
- `normalizeCountry()` en `app.js` es la función de lookup: elimina tildes, minúsculas, colapsa espacios. Cualquier país nuevo en el dataset debe pasar esa normalización para matchear con `COUNTRY_META`.
- Las imágenes en `images/foods/` están normalizadas a **960×660** (aspect 16:11). La CSS de `#food-image` usa `object-fit: cover`, así que la imagen siempre llena la caja `.food-image-wrap` (sin bandas blancas). Si una imagen no respeta el aspect 16:11, va a quedar **recortada** desde los bordes (recorte centrado por default). Al agregar una nueva, mantener 960×660 / 16:11 para evitar perder contenido de la foto. Si necesitás controlar qué parte queda visible al recortar, ajustar `object-position` puntualmente para esa imagen.
- Si el navegador de preview muestra una versión vieja del CSS tras editar `styles.css`, forzar reload del stylesheet via JS (cambiar `link.href` con un query param `?v=Date.now()`) o reiniciar el server de preview.
