(() => {
  const LEVEL_ORDER = ["easy", "medium", "hard"];
  const LEVEL_LABELS = {
    easy: "Fácil",
    medium: "Intermedio",
    hard: "Difícil",
  };
  const ROUNDS_PER_LEVEL = 10;
  const POINTS_PER_HIT = 10;
  const POSITIVE_FEEDBACK = ["¡Correcto!", "¡Muy bien!", "¡Excelente!", "¡Genial!"];
  const NEGATIVE_FEEDBACK = [
    "¡Ups! No era esa",
    "Casi, casi...",
    "No pasa nada, seguí intentando",
    "Esta vez no, pero vamos bien",
  ];

  const COUNTRY_META = {
    japon: { iso: "JP", coords: [36.2, 138.25] },
    espana: { iso: "ES", coords: [40.4, -3.7] },
    italia: { iso: "IT", coords: [42.6, 12.5] },
    francia: { iso: "FR", coords: [46.2, 2.2] },
    alemania: { iso: "DE", coords: [51.0, 10.0] },
    hungria: { iso: "HU", coords: [47.2, 19.5] },
    grecia: { iso: "GR", coords: [39.1, 22.9] },
    marruecos: { iso: "MA", coords: [31.8, -7.1] },
    ucrania: { iso: "UA", coords: [48.4, 31.2] },
    "reino unido": { iso: "GB", coords: [55.3, -3.4] },
    brasil: { iso: "BR", coords: [-10.0, -52.0] },
    argentina: { iso: "AR", coords: [-38.4, -63.6] },
    peru: { iso: "PE", coords: [-9.2, -75.0] },
    mexico: { iso: "MX", coords: [23.6, -102.5] },
    canada: { iso: "CA", coords: [56.1, -106.3] },
    "estados unidos": { iso: "US", coords: [39.8, -98.6] },
    india: { iso: "IN", coords: [22.8, 79.0] },
    tailandia: { iso: "TH", coords: [15.6, 101.0] },
    vietnam: { iso: "VN", coords: [14.1, 108.3] },
    "corea del sur": { iso: "KR", coords: [36.4, 127.9] },
    china: { iso: "CN", coords: [35.8, 104.2] },
    etiopia: { iso: "ET", coords: [9.1, 40.5] },
    nigeria: { iso: "NG", coords: [9.1, 8.7] },
    israel: { iso: "IL", coords: [31.0, 35.0] },
    paraguay: { iso: "PY", coords: [-23.4, -58.4] },
    "el salvador": { iso: "SV", coords: [13.7, -89.2] },
    "costa rica": { iso: "CR", coords: [9.9, -84.1] },
    suecia: { iso: "SE", coords: [62.0, 15.0] },
    uruguay: { iso: "UY", coords: [-32.5, -55.8] },
    turquia: { iso: "TR", coords: [39.0, 35.2] },
    colombia: { iso: "CO", coords: [4.6, -74.1] },
  };

  const SMALL_COUNTRY_CODES = new Set([
    "KR",
    "GB",
    "IE",
    "PT",
    "BE",
    "NL",
    "UY",
    "SV",
    "CR",
    "IL",
  ]);

  const state = {
    startLevel: "easy",
    startLevelIndex: 0,
    levelIndex: 0,
    roundIndex: 0,
    levelAnswered: 0,
    questions: [],
    score: 0,
    hits: 0,
    answered: 0,
    lives: 3,
    outOfLives: false,
    usedFoodNames: new Set(),
    currentQuestion: null,
    lastAnswer: null,
    pendingLevelUp: false,
    pendingFinish: false,
    mapInstance: null,
  };

  const refs = {
    screens: {
      start: document.getElementById("screen-start"),
      game: document.getElementById("screen-game"),
      feedback: document.getElementById("screen-feedback"),
      final: document.getElementById("screen-final"),
    },
    startGameBtn: document.getElementById("start-game-btn"),
    playAgainBtn: document.getElementById("play-again-btn"),
    restartBtn: document.getElementById("restart-btn"),
    difficultyOptions: Array.from(document.querySelectorAll(".difficulty-option")),
    difficultyInputs: Array.from(
      document.querySelectorAll('input[name="difficulty"]')
    ),
    levelPill: document.getElementById("level-pill"),
    progressFill: document.getElementById("progress-fill"),
    foodImage: document.getElementById("food-image"),
    foodPlaceholder: document.getElementById("food-placeholder"),
    foodPlaceholderLetter: document.getElementById("food-placeholder-letter"),
    foodName: document.getElementById("food-name"),
    optionsGrid: document.getElementById("options-grid"),
    scoreLabel: document.getElementById("score-label"),
    livesLabel: document.getElementById("lives-label"),
    feedbackBadge: document.getElementById("feedback-badge"),
    feedbackAnswer: document.getElementById("feedback-answer"),
    feedbackFunFact: document.getElementById("feedback-fun-fact"),
    feedbackLevelUp: document.getElementById("feedback-level-up"),
    nextRoundBtn: document.getElementById("next-round-btn"),
    countryMap: document.getElementById("country-map"),
    mapCountryNote: document.getElementById("map-country-note"),
    finalSummary: document.getElementById("final-summary"),
    finalDetails: document.getElementById("final-details"),
  };

  function init() {
    if (!Array.isArray(window.FOODS_DATA) || window.FOODS_DATA.length === 0) {
      refs.startGameBtn.disabled = true;
      refs.startGameBtn.textContent = "No hay comidas cargadas";
      return;
    }

    refs.startGameBtn.addEventListener("click", startGame);
    refs.playAgainBtn.addEventListener("click", resetToStart);
    refs.restartBtn.addEventListener("click", resetToStart);
    refs.nextRoundBtn.addEventListener("click", continueAfterFeedback);
    refs.difficultyInputs.forEach((input) =>
      input.addEventListener("change", syncDifficultySelection)
    );
    refs.foodImage.addEventListener("error", showImagePlaceholder);
    refs.foodImage.addEventListener("load", showLoadedImage);
    syncDifficultySelection();
    showScreen("start");
  }

  function startGame() {
    const selectedLevel =
      refs.difficultyInputs.find((input) => input.checked)?.value || "easy";
    const selectedIndex = LEVEL_ORDER.indexOf(selectedLevel);

    state.startLevel = selectedLevel;
    state.startLevelIndex = selectedIndex >= 0 ? selectedIndex : 0;
    state.levelIndex = state.startLevelIndex;
    state.roundIndex = 0;
    state.levelAnswered = 0;
    state.score = 0;
    state.hits = 0;
    state.answered = 0;
    state.lives = 3;
    state.outOfLives = false;
    state.usedFoodNames = new Set();
    state.pendingLevelUp = false;
    state.pendingFinish = false;
    state.lastAnswer = null;

    buildQuestionsForCurrentLevel();
    renderQuestion();
    showScreen("game");
  }

  function buildQuestionsForCurrentLevel() {
    const levelKey = LEVEL_ORDER[state.levelIndex];
    const pool = window.FOODS_DATA.filter(
      (food) => food?.country && food?.distractors?.[levelKey]?.length >= 2
    );

    if (pool.length === 0) {
      state.questions = [];
      return;
    }

    const selected = [];
    const unusedPool = shuffle(
      pool.filter((food) => !state.usedFoodNames.has(getFoodId(food)))
    );

    for (const food of unusedPool) {
      if (selected.length >= ROUNDS_PER_LEVEL) break;
      selected.push(food);
    }

    if (selected.length < ROUNDS_PER_LEVEL) {
      const fallbackUnique = shuffle(
        pool.filter(
          (food) =>
            !selected.some((picked) => getFoodId(picked) === getFoodId(food))
        )
      );
      for (const food of fallbackUnique) {
        if (selected.length >= ROUNDS_PER_LEVEL) break;
        selected.push(food);
      }
    }

    while (selected.length < ROUNDS_PER_LEVEL) {
      selected.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    selected.forEach((food) => state.usedFoodNames.add(getFoodId(food)));
    state.questions = selected.map((food) => createQuestion(food, levelKey));
    state.roundIndex = 0;
    state.levelAnswered = 0;
  }

  function createQuestion(food, levelKey) {
    const levelDistractors = Array.isArray(food.distractors?.[levelKey])
      ? [...food.distractors[levelKey]]
      : [];
    const uniqueDistractors = Array.from(
      new Set(levelDistractors.filter((country) => country !== food.country))
    );
    const fallback = getFallbackCountries(food.country, uniqueDistractors, 2);
    const selectedDistractors = shuffle([...uniqueDistractors, ...fallback]).slice(
      0,
      2
    );
    const options = shuffle([food.country, ...selectedDistractors]);

    return {
      food,
      level: levelKey,
      options,
      correctCountry: food.country,
    };
  }

  function getFallbackCountries(correctCountry, usedDistractors, needed) {
    const allCountries = Array.from(
      new Set(window.FOODS_DATA.map((food) => food.country))
    );
    const available = allCountries.filter(
      (country) =>
        country !== correctCountry && !usedDistractors.includes(country)
    );
    return shuffle(available).slice(0, needed);
  }

  function renderQuestion() {
    state.currentQuestion = state.questions[state.roundIndex];

    if (!state.currentQuestion) {
      showFinal();
      return;
    }

    const { food, level } = state.currentQuestion;
    refs.levelPill.textContent = "Nivel " + LEVEL_LABELS[level];
    refs.scoreLabel.textContent = "Puntaje: " + String(state.score);
    refs.livesLabel.textContent = "Vidas: " + ("❤".repeat(state.lives) || "0");
    refs.foodName.textContent = food.food_name;
    setFoodImage(food.image, food.food_name);
    updateLevelProgress();

    refs.optionsGrid.innerHTML = "";
    state.currentQuestion.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-btn";
      button.textContent = option;
      button.addEventListener("click", () => handleAnswer(option));
      refs.optionsGrid.appendChild(button);
    });
  }

  function handleAnswer(selectedCountry) {
    const question = state.currentQuestion;
    if (!question) return;

    disableOptionButtons();
    const isCorrect = selectedCountry === question.correctCountry;
    state.answered += 1;
    state.levelAnswered += 1;
    if (isCorrect) {
      state.hits += 1;
      state.score += POINTS_PER_HIT;
    } else {
      state.lives = Math.max(0, state.lives - 1);
    }

    state.lastAnswer = {
      isCorrect,
      selectedCountry,
      question,
    };

    const isLastRoundInLevel = state.roundIndex >= state.questions.length - 1;
    const hasNextLevel = state.levelIndex < LEVEL_ORDER.length - 1;
    state.outOfLives = state.lives <= 0;
    state.pendingLevelUp = !state.outOfLives && isLastRoundInLevel && hasNextLevel;
    state.pendingFinish =
      state.outOfLives || (isLastRoundInLevel && !hasNextLevel);

    showFeedback();
  }

  function showFeedback() {
    const answer = state.lastAnswer;
    if (!answer) return;

    const phrase = answer.isCorrect
      ? randomItem(POSITIVE_FEEDBACK)
      : randomItem(NEGATIVE_FEEDBACK);

    refs.feedbackBadge.textContent = phrase;
    refs.feedbackBadge.classList.remove("good", "bad");
    refs.feedbackBadge.classList.add(answer.isCorrect ? "good" : "bad");
    refs.feedbackAnswer.textContent =
      "Respuesta correcta: " + answer.question.correctCountry;
    refs.feedbackFunFact.textContent =
      "¿Sabías qué? " + getRandomFact(answer.question.food);

    if (state.pendingLevelUp) {
      const currentLabel = LEVEL_LABELS[LEVEL_ORDER[state.levelIndex]];
      const nextLabel = LEVEL_LABELS[LEVEL_ORDER[state.levelIndex + 1]];
      refs.feedbackLevelUp.hidden = false;
      refs.feedbackLevelUp.textContent =
        "Completaste el nivel " +
        currentLabel +
        ". ¡Ahora pasás a " +
        nextLabel +
        "!";
      refs.nextRoundBtn.textContent = "Ir a " + nextLabel;
    } else if (state.pendingFinish) {
      refs.feedbackLevelUp.hidden = true;
      refs.nextRoundBtn.textContent = "Ver resultado final";
    } else {
      refs.feedbackLevelUp.hidden = true;
      refs.nextRoundBtn.textContent = "Siguiente ronda";
    }

    updateLevelProgress();
    showScreen("feedback");
    renderCountryMap(answer.question.correctCountry);
  }

  function renderCountryMap(countryName) {
    const meta = COUNTRY_META[normalizeCountry(countryName)];
    refs.mapCountryNote.hidden = true;
    refs.mapCountryNote.textContent = "";

    if (!meta || typeof window.jsVectorMap === "undefined") {
      refs.countryMap.textContent =
        "Mapa no disponible para este país en este momento.";
      return;
    }

    refs.countryMap.innerHTML = "";

    const markers = [];
    if (SMALL_COUNTRY_CODES.has(meta.iso) && Array.isArray(meta.coords)) {
      markers.push({
        name: countryName,
        coords: meta.coords,
      });
      refs.mapCountryNote.hidden = false;
      refs.mapCountryNote.textContent = "↗ País señalado: " + countryName;
    }

    try {
      if (state.mapInstance && typeof state.mapInstance.destroy === "function") {
        state.mapInstance.destroy();
      }

      state.mapInstance = new jsVectorMap({
        selector: "#country-map",
        map: "world_merc",
        backgroundColor: "transparent",
        zoomButtons: false,
        zoomOnScroll: false,
        zoomOnScrollSpeed: 0,
        draggable: false,
        regionStyle: {
          initial: {
            fill: "#cfe2f3",
            stroke: "#ffffff",
            strokeWidth: 0.6,
          },
          hover: {
            fill: "#8ec2ff",
          },
          selected: {
            fill: "#ff8c42",
          },
          selectedHover: {
            fill: "#ff8c42",
          },
        },
        regionsSelectable: true,
        selectedRegions: [meta.iso],
        markers,
        markerStyle: {
          initial: {
            fill: "#ff5f79",
            stroke: "#ffffff",
            strokeWidth: 2,
            r: 4.5,
          },
          hover: {
            fill: "#ff2f53",
          },
        },
      });

      if (typeof state.mapInstance.updateSize === "function") {
        state.mapInstance.updateSize();
      }
    } catch (error) {
      refs.countryMap.textContent = "No se pudo renderizar el mapa.";
    }
  }

  function continueAfterFeedback() {
    if (state.pendingLevelUp) {
      state.levelIndex += 1;
      state.pendingLevelUp = false;
      buildQuestionsForCurrentLevel();
      renderQuestion();
      showScreen("game");
      return;
    }

    if (state.pendingFinish) {
      state.pendingFinish = false;
      showFinal();
      return;
    }

    state.roundIndex += 1;
    renderQuestion();
    showScreen("game");
  }

  function showFinal() {
    const totalRounds = state.answered;
    const maxScore = totalRounds * POINTS_PER_HIT;
    const percent =
      totalRounds > 0 ? Math.round((state.hits / totalRounds) * 100) : 0;
    const startLabel = LEVEL_LABELS[state.startLevel];

    refs.finalSummary.textContent =
      "Lograste " +
      String(state.hits) +
      " aciertos de " +
      String(totalRounds) +
      " rondas.";
    const cierreRecorrido = state.outOfLives
      ? "Te quedaste sin vidas en este intento."
      : "Completaste todos los niveles disponibles desde ahí.";

    refs.finalDetails.textContent =
      "Puntaje final: " +
      String(state.score) +
      " / " +
      String(maxScore) +
      " puntos (" +
      String(percent) +
      "%). Empezaste en " +
      startLabel +
      ". " +
      cierreRecorrido;

    showScreen("final");
  }

  function setFoodImage(imagePath, foodName) {
    const hasImagePath = typeof imagePath === "string" && imagePath.trim() !== "";
    refs.foodPlaceholderLetter.textContent = getFirstLetter(foodName);

    if (!hasImagePath) {
      showImagePlaceholder();
      return;
    }

    refs.foodImage.hidden = false;
    refs.foodPlaceholder.hidden = true;
    refs.foodImage.src = imagePath;
    refs.foodImage.alt = "Imagen de " + foodName;
  }

  function showImagePlaceholder() {
    refs.foodImage.hidden = true;
    refs.foodPlaceholder.hidden = false;
  }

  function showLoadedImage() {
    refs.foodImage.hidden = false;
    refs.foodPlaceholder.hidden = true;
  }

  function getFirstLetter(value) {
    if (typeof value !== "string" || value.trim() === "") return "?";
    return value.trim().charAt(0).toUpperCase();
  }

  function disableOptionButtons() {
    const buttons = refs.optionsGrid.querySelectorAll("button");
    buttons.forEach((button) => {
      button.disabled = true;
    });
  }

  function updateLevelProgress() {
    const ratio = Math.max(
      0,
      Math.min(1, state.levelAnswered / ROUNDS_PER_LEVEL)
    );
    refs.progressFill.style.width = String(ratio * 100) + "%";
  }

  function getRandomFact(food) {
    const facts = [food.fun_fact];
    if (Array.isArray(food.extra_fun_facts)) {
      food.extra_fun_facts.forEach((fact) => {
        if (typeof fact === "string" && fact.trim()) facts.push(fact.trim());
      });
    }
    return randomItem(facts);
  }

  function getFoodId(food) {
    return String(food?.food_name || "").trim().toLowerCase();
  }

  function normalizeCountry(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resetToStart() {
    showScreen("start");
  }

  function syncDifficultySelection() {
    refs.difficultyOptions.forEach((option) => {
      const input = option.querySelector("input");
      option.classList.toggle("selected", Boolean(input?.checked));
    });
  }

  function showScreen(targetKey) {
    Object.entries(refs.screens).forEach(([key, section]) => {
      section.classList.toggle("is-active", key === targetKey);
    });
  }

  function getTotalRoundsPlanned() {
    return (LEVEL_ORDER.length - state.startLevelIndex) * ROUNDS_PER_LEVEL;
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  init();
})();
