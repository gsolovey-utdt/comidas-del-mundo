# CLAUDE.md — Comidas del Mundo

## Comunicación

- Referirse al usuario como **Guillermo**

---

## Descripción del proyecto

**Comidas del Mundo** es una web app educativa y gamificada para niños/as. Muestra una comida (nombre + imagen) y el jugador tiene que elegir el país de origen entre 3 opciones. Tiene 4 niveles de dificultad (Fácil, Intermedio, Difícil, Relámpago), sistema de vidas, puntaje, feedback inmediato con dato curioso, y un mapa mundial que resalta el país correcto.

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
| `LEVEL_ORDER` | Orden de niveles | `["easy", "medium", "hard", "flash"]` |
| `LEVELS` | Config por nivel: `{ label, showName, showFlags, timeLimitMs }`. La dificultad se escalona por **pistas** (nombre / bandera), no por distractores. `flash` (Relámpago) muestra todas las pistas + 4000 ms por pregunta | ver `app.js` |
| `COUNTRY_META` | ISO + bandera + nombre + coords (+ `continent`, inyectado desde `CONTINENT_BY_COUNTRY` al cargar) por país | ver `app.js` |
| `CONTINENT_BY_COUNTRY` / `DISTRACTOR_POOL` | Continente por país (5 continentes, América única) y pool de ~95 países conocidos para generar distractores. Los países sin continente quedan fuera del pool | ver `app.js` |
| `SMALL_COUNTRY_CODES` | Países marcados con pin en vez de región coloreada | `KR, GB, IE, PT, BE, NL, UY, SV, CR, IL, …` |

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
| `answer_label` | Frase corta de feedback, ej. "La paella es de" |
| `fun_fact` | Dato curioso |

**Los distractores ya no se cargan en el CSV.** Se generan en runtime por continente (1 del mismo continente que el país correcto + 1 de otro), desde `DISTRACTOR_POOL` en `app.js`. Si el CSV/Sheet todavía tiene columnas `distractors_*`, `build_foods.py` las ignora.

### Validaciones que hace `build_foods.py`

- Cada `country` (correcto) normaliza a una clave de `COUNTRY_META` en `app.js`. Si no está, el script falla pidiendo agregar el país.
- Si una imagen del campo `image` no existe en disco, sale un warning (no falla).
- Las columnas `distractors_*` se ignoran si todavía están presentes (legacy).

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

1. Agregar una fila en el Google Sheet con todos los campos (ver tabla arriba). **Ya no hay que cargar distractores.**
2. Copiar imagen en `images/foods/` y referenciarla en `image`.
3. Si el país correcto no está en `COUNTRY_META`, agregarlo en `app.js` con ISO, bandera, nombre y coords, **y asignarle continente en `CONTINENT_BY_COUNTRY`** (si no, queda fuera del pool de distractores; ver sección siguiente).
4. Si el país es visualmente pequeño en el mapa, agregar su ISO a `SMALL_COUNTRY_CODES`.
5. Bajar el CSV actualizado y correr `python scripts/build_foods.py`.

---

## Agregar un país nuevo al mapa

En `app.js`:
1. Agregar una entrada en `COUNTRY_META`:
   ```js
   "nombre normalizado": { iso: "XX", flag: "🏳️", name: "Nombre", coords: [lat, lng] }
   ```
2. Asignarle continente en `CONTINENT_BY_COUNTRY` (`"América" | "Europa" | "Asia" | "África" | "Oceanía"`). Sin continente, el país **no** entra al pool de distractores (queda disponible sólo para el mapa y el comodín de banderas).

El nombre normalizado es el `country` del dataset sin tildes, en minúsculas (lo que devuelve `normalizeCountry()`).

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
| `sdm_sessions` | Una fila por partida: `session_id` (UUID), `player_country`, `start_level`, `age` (edad obligatoria del jugador) |
| `sdm_answers` | Una fila por respuesta (incluye comodines): tiempos de reacción, `is_wildcard`, `wildcard_type`, y `distractor_same` / `distractor_other` (los 2 distractores mostrados: mismo continente / otro; `NULL` en comodines) |
| `sdm_final_writeups` | Texto creativo final (opcional) |
| `sdm_suggestions` | Sugerencias de países a agregar (una fila por envío): `session_id`, `country`. **Requiere correr el SQL nuevo de `schema.sql` una vez** para que persista. |

- **Cliente:** UMD vía CDN (`async` para no bloquear scripts diferidos). Inicialización lazy: `getDb()` crea el cliente la primera vez que se necesita.
- **Estrategia:** fire-and-forget con `saveQuiet()`. Si Supabase no está disponible (offline, CDN lento), el juego continúa sin interrupciones.
- **RLS:** `anon_insert` policies en las 4 tablas. Sólo inserts desde el browser anónimo.
- **session_id:** `crypto.randomUUID()` en memoria, no persiste entre recargas.
- **Migración:** `age` (en `sdm_sessions`) y `distractor_same`/`distractor_other` (en `sdm_answers`) requieren correr los `ALTER TABLE ... add column if not exists` de `schema.sql` una vez en el proyecto, que ya tenía las tablas creadas.

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
| 2026-06 | 4º nivel "Relámpago" ⚡ (3 s por pregunta) | Idea del hijo de Guillermo. Se agregó como nivel nuevo (no reemplaza Difícil). **Reusa los distractores de `hard`** (no toca el dataset); la dificultad extra viene 100% del reloj. Timeout = error (pierde vida, revela la correcta, mensaje "⏱️ ¡Se acabó el tiempo!"). Para no romper el lookup `food.distractors[levelKey]` se introdujo el mapa `LEVELS` que desacopla la clave de nivel de la clave de distractores y agrega `timeLimitMs`. La barra de cuenta regresiva (`#question-timer-bar`) replica el patrón de `#auto-advance-bar` (transición `scaleX`). **Capacidad:** una partida completa pasa de 30 a 40 rondas; con 48 comidas y `usedFoodNames` activo no hay repeticiones (40 < 48), pero el margen quedó ajustado: subir `ROUNDS_PER_LEVEL` o agregar otro nivel empezaría a repetir comidas. |
| 2026-06 | Sin animación de opacidad al cambiar de pantalla | `.screen.is-active` tenía `animation: fade-in` (opacity 0→1). En las transiciones (ej. juego → feedback) la caja nueva aparecía desde transparente = "pestañeo" donde la caja clara desaparecía un instante. Se quitó la animación: como en desktop las 6 cajas comparten tamaño/posición, ahora la caja se mantiene visible y sólo cambia el contenido. |
| 2026-06 | La barra de tiempo reserva su lugar (no desplaza el layout) | Mismo principio que el `min-height` del `.question-slot` (que reserva el alto del cartel ✓/✗). La barra del nivel Relámpago no se oculta con `display:none` al vaciarse/responder (eso desplazaba el texto de arriba): el riel queda presente y vacío durante el revelado. En niveles sin tiempo se aplica `.is-off` (`display:none`) y entonces sí no ocupa lugar. La barra arranca con `is-off` en el HTML y `startQuestionCountdown` la togglea según `timeLimitMs`. |
| 2026-06 | Inicio en desktop: compresión para 4 niveles | La 4ª opción agregó una 2ª fila al picker y empujaba "Empezar a jugar" fuera de la caja fija de 680 px (se recortaba). En `@media (min-width:561px)` se comprimió el `.start-card` (carrusel 170→100 px, menos márgenes en lead/picker/country-picker). Verificado: entra completo hasta ventanas de ~700 px de alto. |
| 2026-06 | Colección final centrada con `justify-content: safe center` | Con pocas comidas la grilla (`grid-auto-flow: column`) quedaba pegada a la izquierda. `safe center` centra cuando no desborda y cae a `start` cuando hay muchas, preservando el scroll horizontal hasta la primera tarjeta. |
| 2026-06 | Timeout guarda centinela `"(sin respuesta)"` en `selected_country` | La columna es `NOT NULL`; el timeout no tiene país elegido. En vez de migrar la tabla, se guarda un centinela legible (`selectedCountry \|\| "(sin respuesta)"` en el insert de `sdm_answers`). Evita que la fila de timeout se rechace en silencio. |
| 2026-06 | Level-up por nivel + opción de terminar | Al completar cada nivel (que tenga uno siguiente) se felicita por **ese** nivel específico (`showLevelUp` usa `LEVEL_ORDER[state.levelIndex]`, el recién completado) y se ofrecen dos botones: seguir al siguiente nivel o **terminar y ver lo aprendido** (`finishFromLevelUp` → `showFinal`). El último nivel no tiene siguiente, así que va directo al final. |
| 2026-06 | Resumen final preciso | Antes decía siempre "¡Completaste todos los niveles!" aunque el jugador hubiera arrancado en un nivel avanzado o terminado antes. Ahora: game over → mensaje de game over; `completedAll` (arrancó en el primero **y** llegó al último) → "todos los niveles"; en otro caso → "¡Completaste el nivel [X]!". |
| 2026-06 | Racha eliminada; puntaje al centro-abajo del header | La pastilla de racha 🔥 (decorativa) se sacó por completo (HTML, CSS, `state.streak`, `updateStreakDisplay`). El `#score-label` se movió a la celda central de la fila inferior del grid del header (donde estaba la racha). |
| 2026-06 | 5ª página final: sugerir un país | Desplegable con **todos** los países del mundo (`ALL_COUNTRIES_ES` en `app.js`, ~191); los que ya tienen comida (detectados normalizando contra `FOODS_DATA`) aparecen deshabilitados con "✓ (ya está)". Se guarda en `sdm_suggestions` (fire-and-forget). Se eligió "todos marcando los presentes" sobre "solo los faltantes" para que el chico vea el panorama completo. |
| 2026-06 | Dificultad por **pistas**, no por distractores | Antes Fácil/Intermedio/Difícil sólo cambiaban los distractores: un eje poco perceptible para un chico, costoso de autorear (6 países/comida), y que **confunde** el efecto del nivel con el del distractor en los datos. Ahora se escalonan pistas: Fácil = foto+nombre+bandera · Intermedio = sin bandera · Difícil = sólo foto. Relámpago = todas las pistas (= Fácil) + reloj. `LEVELS` pasó de `distractors` a `{ showName, showFlags, timeLimitMs }`; `renderQuestion` gatea `#food-name` (con `visibility:hidden` para reservar el alto) y la bandera de cada opción. |
| 2026-06 | Distractores **generados por continente**, invariantes al nivel | 1 distractor del mismo continente que el país correcto + 1 de otro, al azar, desde `DISTRACTOR_POOL` (~95 países conocidos de `COUNTRY_META` con `continent`). Se eliminaron los autorados (`distractors_*` del CSV). Ventaja: el distractor queda **ortogonal al nivel** (identificación limpia para medir el efecto de las pistas) y se acaba la curaduría por comida. Pool acotado a países conocidos para que ningún distractor sea ininteligible; América es un solo continente (modelo escolar). Cada distractor mostrado se loguea (`distractor_same`/`distractor_other`) para estimar su efecto por separado. Trade-off: se pierden las "trampas" culinarias autoradas (ej. España para empanadas). |
| 2026-06 | Relámpago a 4 s (era 3 s) + edad obligatoria | Relámpago: +1 s para que exija sin frustrar; con todas las pistas visibles, la única dificultad es el reloj. Edad: campo numérico **obligatorio** al lado del país en el inicio (para el análisis); `startGame` valida y sacude el campo si falta o está fuera de `[AGE_MIN, AGE_MAX]`. |

---

## Pendientes

Ideas surgidas de una revisión de diseño (mayo 2026), en orden de impacto estimado:

- **Modo "click en el mapa"**: en lugar de 3 botones de texto, mostrar el mapa mundi y que el jugador haga clic directamente en el país. Recall puro, más educativo. Sería otro nivel de dificultad.
- **Auto-advance más lento / pausable**: 4.5s puede ser poco para lectores lentos. Considerar 6–7s o permitir pausar el timer con un botón explícito.
- **Share card con canvas**: generar una imagen sharable con puntaje + países visitados, sin backend. Ideal para que padres muestren lo que aprendió su hijo.
- **Rediseño de pantalla de inicio**: evaluar si la selección de nivel pertenece al inicio o puede moverse (ej. preguntarlo antes de la primera ronda). Explorar agregar imágenes atractivas de comidas o personas comiendo en distintos países — tipo carrusel o collage — para darle más vida visual antes de empezar. Requiere conseguir imágenes de buena calidad.
- **Revisión de imágenes de comidas**: auditar todo el set en `images/foods/` por (1) aspect ratio — deben ser 960×660 (16:11) para no quedar recortadas con `object-fit: cover` — y (2) calidad visual general (nitidez, encuadre, iluminación). Reemplazar las que no cumplan.
- **Swipe en el carrusel final (mobile)**: en la pantalla final, las 4 sub-pantallas del carrusel (resultado → colección → mapa → texto creativo) sólo se pueden avanzar con botón o flecha de teclado. En mobile debería poder deslizarse con el dedo (touch swipe). Implementar con `touchstart`/`touchend` detectando desplazamiento horizontal ≥ 40–50px.
- **Texto del prompt de escritura creativa más grande**: el texto "✏️ ¿Cuál es tu comida preferida? ¿Querés contarme con quién la comés o quién la prepara?" es difícil de leer en mobile por el tamaño pequeño de fuente. Aumentar `font-size` en esa etiqueta/párrafo, especialmente en el media query `≤560px`.
- **Micro-reacomodo al cargar la pantalla de juego** (detectado 2026-05-31): al entrar por primera vez a la pantalla de juego, el contenido se desplaza ~6px hacia arriba cuando terminan de cargar las fuentes de Google (Bangers / Patrick Hand) y el navegador reflowa con las métricas reales. Es un único salto al cargar (no en cada respuesta; se confirmó que ocurre igual sin responder). Mitigación posible: precargar las fuentes (`<link rel="preload">` de los `.woff2`) y/o `font-display: optional`, o reservar el alto con `size-adjust`/fallback metrics. Bajo impacto; revisar cuando se toque el tema fuentes.

---

## Bugs conocidos / resueltos

- **[Resuelto]** Mapas a partir de la segunda ronda no se renderizaban: `destroy()` se llamaba después de `innerHTML = ""`, lo que causaba un error capturado por el `catch`. Fix: invertir el orden.

---

## Estado actual

**Fase:** Producción / v1.10 (pendiente deploy)  
App desplegada en GitHub Pages. Dataset con **49 comidas** de **31 países**. En mayo 2026 se agregaron: banderas emoji en botones y mapa, dropdown de país del jugador, pantalla animada de transición de nivel, comodín de vidas (bandera→país o descripción→comida), medición de tiempos de respuesta con Supabase, y texto creativo al final. En v1.3: vidas iniciales aumentadas de 3 a 5; pantalla final convertida en carrusel de 4 páginas (resultado → colección de comidas aprendidas → mapa de países visitados → texto creativo). En v1.10 (junio 2026): la dificultad pasó a escalonarse por **pistas** (no por distractores); los distractores se **generan por continente** desde un pool de ~95 países conocidos; Relámpago subió a 4 s; se pide la **edad** (obligatoria) del jugador; y se loguean los distractores mostrados en `sdm_answers`.

---

## Prompt rápido para actualizar el dataset

Cuando Guillermo cambia `data/foods.csv` (ya sea editando el archivo directamente o trayendo un CSV nuevo), el prompt para Claude es:

> "Actualicé `data/foods.csv`, regenerá `foods.js` y pusheá."

Claude debe: (1) correr `python scripts/build_foods.py`, (2) commitear `data/foods.csv` + `data/foods.js` juntos, (3) pushear a `main`.

---

## Notas para Claude

- No hay build. Para testear, basta abrir `index.html` en el navegador (o servir con `python -m http.server 8765 --directory <root>` si se necesita un server HTTP).
- El deploy es automático al pushear a `main` (GitHub Pages).
- Los datos están en `data/foods.js`, no en JSON, para poder usar `window.FOODS_DATA` sin servidor.
- `normalizeCountry()` en `app.js` es la función de lookup: elimina tildes, minúsculas, colapsa espacios. Cualquier país nuevo en el dataset debe pasar esa normalización para matchear con `COUNTRY_META`.
- Las imágenes en `images/foods/` están normalizadas a **960×660** (aspect 16:11). La CSS de `#food-image` usa `object-fit: cover`, así que la imagen siempre llena la caja `.food-image-wrap` (sin bandas blancas). Si una imagen no respeta el aspect 16:11, va a quedar **recortada** desde los bordes (recorte centrado por default). Al agregar una nueva, mantener 960×660 / 16:11 para evitar perder contenido de la foto. Si necesitás controlar qué parte queda visible al recortar, ajustar `object-position` puntualmente para esa imagen.
- Si el navegador de preview muestra una versión vieja del CSS tras editar `styles.css`, forzar reload del stylesheet via JS (cambiar `link.href` con un query param `?v=Date.now()`) o reiniciar el server de preview.
