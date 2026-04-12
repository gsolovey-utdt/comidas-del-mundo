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
| `index.html` | Estructura de pantallas (inicio, juego, feedback, final) |
| `styles.css` | Estilos, responsive, animaciones |
| `app.js` | Toda la lógica del juego |
| `data/foods.js` | Dataset editable de comidas (`window.FOODS_DATA`) |
| `data/image-map.json` | Mapeo auxiliar comida → imagen |
| `images/foods/` | Imágenes de las comidas (JPG normalizadas) |
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

## Decisiones tomadas

| Fecha | Decisión | Motivo |
|-------|----------|--------|
| 2026-04 | Librería de mapa en `vendor/` (local) | Evitar dependencia de CDN externo en Pages |
| 2026-04 | `destroy()` antes de limpiar `innerHTML` | jsVectorMap lanza error si intenta destruir nodos ya eliminados del DOM |
| 2026-04 | Países pequeños con pin en lugar de región coloreada | Algunos ISOs son difíciles de ver en la proyección Mercator a escala mundial |

---

## Bugs conocidos / resueltos

- **[Resuelto]** Mapas a partir de la segunda ronda no se renderizaban: `destroy()` se llamaba después de `innerHTML = ""`, lo que causaba un error capturado por el `catch`. Fix: invertir el orden.

---

## Estado actual

**Fase:** Producción / v1 live  
App desplegada en GitHub Pages. Dataset con 44 comidas de 21 países.

---

## Notas para Claude

- No hay build. Para testear, basta abrir `index.html` en el navegador.
- El deploy es automático al pushear a `main` (GitHub Pages).
- Los datos están en `data/foods.js`, no en JSON, para poder usar `window.FOODS_DATA` sin servidor.
- `normalizeCountry()` en `app.js` es la función de lookup: elimina tildes, minúsculas, colapsa espacios. Cualquier país nuevo en el dataset debe pasar esa normalización para matchear con `COUNTRY_META`.
