# Sabores del Mundo - Quiz Infantil

Web app educativa para niños/as donde se muestra una comida y hay que elegir su país correcto entre 3 opciones.

La app está pensada para ser:
- visual y amigable
- simple de jugar
- fácil de ampliar con más comidas

## Qué incluye hoy

- Pantalla inicial con selección de dificultad (`Fácil`, `Intermedio`, `Difícil`)
- 10 rondas por nivel
- Progresión automática al siguiente nivel al completar el actual
- Sistema de vidas (`3`)
- Puntaje por acierto
- Feedback gamificado en cada respuesta
- Dato curioso aleatorio por comida
- Mapa del mundo con el país correcto resaltado
- Pantalla final con resumen y opción de volver a jugar

## Cómo se juega

1. Elegís dificultad inicial.
2. En cada ronda aparece una comida (nombre + imagen).
3. Seleccionás 1 país entre 3 opciones.
4. Recibís feedback inmediato:
   - mensaje de acierto/error
   - país correcto
   - dato curioso
   - mapa con el país resaltado
5. Si completás 10 rondas, pasás al nivel siguiente automáticamente.
6. Si te quedás sin vidas, termina la partida.

## Lógica de dificultad

Cada comida tiene:
- 1 país correcto
- 2 distractores para `easy`
- 2 distractores para `medium`
- 2 distractores para `hard`

La misma comida puede aparecer en distintos niveles cambiando solo los distractores.

Además, el juego intenta evitar repetir comidas entre niveles mientras haya suficientes disponibles en el dataset.

## Estructura del proyecto

```text
comidas-del-mundo/
├─ index.html                     # Estructura de pantallas (inicio, juego, feedback, final)
├─ styles.css                     # Estética infantil, responsive y animaciones suaves
├─ app.js                         # Estado del juego, rondas, puntaje, vidas, feedback y mapa
├─ README.md
├─ data/
│  ├─ foods.js                    # Dataset principal editable de comidas
│  └─ image-map.json              # Mapa auxiliar de comida -> imagen
├─ images/
│  ├─ placeholder-food.svg        # Placeholder cuando falta imagen
│  └─ foods/                      # Imágenes normalizadas de las comidas
└─ vendor/
   └─ jsvectormap/                # Librería local para renderizar el mapa mundial
```

## Dataset (editable)

El dataset vive en `data/foods.js` como `window.FOODS_DATA`.

Cada objeto tiene, como mínimo:
- `food_name`
- `country`
- `type`
- `food_familiarity`
- `image`
- `fun_fact`
- `extra_fun_facts` (datos adicionales para variar el feedback)
- `distractors` (`easy`, `medium`, `hard`)
- `notes`

Ejemplo:

```js
{
  food_name: "Ramen",
  country: "Japón",
  type: "country",
  food_familiarity: "easy",
  image: "images/foods/ramen.jpg",
  fun_fact: "Es una sopa de fideos muy popular en Japón.",
  extra_fun_facts: [
    "Se prepara de distintas maneras según la región.",
    "Es un plato que suele compartirse en familia o con amigos."
  ],
  distractors: {
    easy: ["Argentina", "Canadá"],
    medium: ["India", "Vietnam"],
    hard: ["China", "Corea del Sur"]
  },
  notes: "En difícil conviene usar países cercanos cultural o geográficamente."
}
```

## Cómo agregar nuevas comidas

1. Agregá un objeto nuevo en `data/foods.js`.
2. Completá los 3 niveles de distractores (`easy`, `medium`, `hard`).
3. Copiá la imagen en `images/foods/` y referenciala en `image`.
4. Si no hay imagen, podés usar temporalmente `images/placeholder-food.svg`.
5. Si el país no se pinta en el mapa, agregalo en `COUNTRY_META` dentro de `app.js` (código ISO + coordenadas).

## Recomendaciones para imágenes

- Mantener estilo consistente (idealmente ilustración o foto limpia).
- Sin texto dentro de la imagen.
- Comida centrada.
- Todas en tamaño uniforme para una UI prolija (en este proyecto están normalizadas para mostrarse de forma consistente).

## Ejecución local

No requiere build ni dependencias.

Opciones:
- Abrir `index.html` directamente en el navegador.
- O correr un servidor estático simple (recomendado en algunos navegadores).

## Personalización rápida

En `app.js` podés ajustar:
- `ROUNDS_PER_LEVEL` (rondas por nivel)
- `POINTS_PER_HIT` (puntos por acierto)
- `POSITIVE_FEEDBACK` / `NEGATIVE_FEEDBACK` (mensajes)
- `LEVEL_ORDER` / `LEVEL_LABELS`

## Nota de codificación (acentos)

Para evitar problemas con acentos, asegurate de editar los archivos en **UTF-8**.
`index.html` ya declara:

```html
<meta charset="UTF-8" />
```

