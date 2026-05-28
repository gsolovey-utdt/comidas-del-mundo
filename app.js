(() => {
  const SUPABASE_URL = "https://irryksaoygdklwtsjsru.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_9zF3s9-hDyRRVi5OqAFP-w_z9Mrx9bt";
  let _db = undefined;
  function getDb() {
    if (_db === undefined) {
      _db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) ?? null;
    }
    return _db;
  }
  async function saveQuiet(promise) {
    try { await promise; } catch (_) {}
  }

  function parseEmoji(el) {
    if (typeof window.twemoji !== "undefined") {
      window.twemoji.parse(el, { folder: "svg", ext: ".svg" });
    }
  }

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
    japon:            { iso: "JP", flag: "🇯🇵", name: "Japón",          coords: [36.2,  138.25] },
    espana:           { iso: "ES", flag: "🇪🇸", name: "España",         coords: [40.4,   -3.7 ] },
    italia:           { iso: "IT", flag: "🇮🇹", name: "Italia",         coords: [42.6,   12.5 ] },
    francia:          { iso: "FR", flag: "🇫🇷", name: "Francia",        coords: [46.2,    2.2 ] },
    alemania:         { iso: "DE", flag: "🇩🇪", name: "Alemania",       coords: [51.0,   10.0 ] },
    hungria:          { iso: "HU", flag: "🇭🇺", name: "Hungría",        coords: [47.2,   19.5 ] },
    grecia:           { iso: "GR", flag: "🇬🇷", name: "Grecia",         coords: [39.1,   22.9 ] },
    marruecos:        { iso: "MA", flag: "🇲🇦", name: "Marruecos",      coords: [31.8,   -7.1 ] },
    ucrania:          { iso: "UA", flag: "🇺🇦", name: "Ucrania",        coords: [48.4,   31.2 ] },
    "reino unido":    { iso: "GB", flag: "🇬🇧", name: "Reino Unido",    coords: [55.3,   -3.4 ] },
    brasil:           { iso: "BR", flag: "🇧🇷", name: "Brasil",         coords: [-10.0, -52.0 ] },
    argentina:        { iso: "AR", flag: "🇦🇷", name: "Argentina",      coords: [-38.4, -63.6 ] },
    peru:             { iso: "PE", flag: "🇵🇪", name: "Perú",           coords: [ -9.2, -75.0 ] },
    mexico:           { iso: "MX", flag: "🇲🇽", name: "México",         coords: [ 23.6,-102.5 ] },
    canada:           { iso: "CA", flag: "🇨🇦", name: "Canadá",         coords: [ 56.1,-106.3 ] },
    "estados unidos": { iso: "US", flag: "🇺🇸", name: "Estados Unidos", coords: [ 39.8, -98.6 ] },
    india:            { iso: "IN", flag: "🇮🇳", name: "India",          coords: [ 22.8,  79.0 ] },
    tailandia:        { iso: "TH", flag: "🇹🇭", name: "Tailandia",      coords: [ 15.6, 101.0 ] },
    vietnam:          { iso: "VN", flag: "🇻🇳", name: "Vietnam",        coords: [ 14.1, 108.3 ] },
    "corea del sur":  { iso: "KR", flag: "🇰🇷", name: "Corea del Sur",  coords: [ 36.4, 127.9 ] },
    china:            { iso: "CN", flag: "🇨🇳", name: "China",          coords: [ 35.8, 104.2 ] },
    etiopia:          { iso: "ET", flag: "🇪🇹", name: "Etiopía",        coords: [  9.1,  40.5 ] },
    nigeria:          { iso: "NG", flag: "🇳🇬", name: "Nigeria",        coords: [  9.1,   8.7 ] },
    israel:           { iso: "IL", flag: "🇮🇱", name: "Israel",         coords: [ 31.0,  35.0 ] },
    paraguay:         { iso: "PY", flag: "🇵🇾", name: "Paraguay",       coords: [-23.4, -58.4 ] },
    "el salvador":    { iso: "SV", flag: "🇸🇻", name: "El Salvador",    coords: [ 13.7, -89.2 ] },
    "costa rica":     { iso: "CR", flag: "🇨🇷", name: "Costa Rica",     coords: [  9.9, -84.1 ] },
    suecia:           { iso: "SE", flag: "🇸🇪", name: "Suecia",         coords: [ 62.0,  15.0 ] },
    uruguay:          { iso: "UY", flag: "🇺🇾", name: "Uruguay",        coords: [-32.5, -55.8 ] },
    turquia:          { iso: "TR", flag: "🇹🇷", name: "Turquía",        coords: [ 39.0,  35.2 ] },
    colombia:         { iso: "CO", flag: "🇨🇴", name: "Colombia",       coords: [  4.6, -74.1 ] },
  };

  const SMALL_COUNTRY_CODES = new Set([
    "KR", "GB", "IE", "PT", "BE", "NL", "UY", "SV", "CR", "IL",
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
    playerCountry: "argentina",
    sessionId: null,
    questionStartedAt: 0,
    seenFoods: [],
    wildcardType: null,
    wildcardCorrect: null,
  };

  const refs = {
    screens: {
      start:    document.getElementById("screen-start"),
      game:     document.getElementById("screen-game"),
      feedback: document.getElementById("screen-feedback"),
      levelup:  document.getElementById("screen-levelup"),
      wildcard: document.getElementById("screen-wildcard"),
      final:    document.getElementById("screen-final"),
    },
    startGameBtn:       document.getElementById("start-game-btn"),
    playAgainBtn:       document.getElementById("play-again-btn"),
    restartBtn:         document.getElementById("restart-btn"),
    difficultyOptions:  Array.from(document.querySelectorAll(".difficulty-option")),
    difficultyInputs:   Array.from(document.querySelectorAll('input[name="difficulty"]')),
    playerCountry:      document.getElementById("player-country"),
    levelPill:          document.getElementById("level-pill"),
    progressFill:       document.getElementById("progress-fill"),
    foodImage:          document.getElementById("food-image"),
    foodPlaceholder:    document.getElementById("food-placeholder"),
    foodPlaceholderLetter: document.getElementById("food-placeholder-letter"),
    foodName:           document.getElementById("food-name"),
    optionsGrid:        document.getElementById("options-grid"),
    scoreLabel:         document.getElementById("score-label"),
    livesLabel:         document.getElementById("lives-label"),
    feedbackBadge:      document.getElementById("feedback-badge"),
    feedbackAnswer:     document.getElementById("feedback-answer"),
    feedbackFunFact:    document.getElementById("feedback-fun-fact"),
    nextRoundBtn:       document.getElementById("next-round-btn"),
    countryMap:         document.getElementById("country-map"),
    countryMapCaption:  document.getElementById("country-map-caption"),
    levelUpTitle:       document.getElementById("levelup-title"),
    levelUpNextBtn:     document.getElementById("levelup-next-btn"),
    wildcardQuestion:   document.getElementById("wildcard-question"),
    wildcardGrid:       document.getElementById("wildcard-grid"),
    wildcardResult:     document.getElementById("wildcard-result"),
    wildcardContinueBtn: document.getElementById("wildcard-continue-btn"),
    finalSummary:       document.getElementById("final-summary"),
    finalDetails:       document.getElementById("final-details"),
    finalText:          document.getElementById("final-text"),
    saveWriteupBtn:     document.getElementById("save-writeup-btn"),
    writeupStatus:      document.getElementById("writeup-status"),
  };

  function getFlag(countryName) {
    const meta = COUNTRY_META[normalizeCountry(countryName)];
    return meta?.flag || "";
  }

  function init() {
    if (!Array.isArray(window.FOODS_DATA) || window.FOODS_DATA.length === 0) {
      refs.startGameBtn.disabled = true;
      refs.startGameBtn.textContent = "No hay comidas cargadas";
      return;
    }

    populateCountryDropdown();

    refs.startGameBtn.addEventListener("click", startGame);
    refs.playAgainBtn.addEventListener("click", resetToStart);
    refs.restartBtn.addEventListener("click", resetToStart);
    refs.nextRoundBtn.addEventListener("click", continueAfterFeedback);
    refs.levelUpNextBtn.addEventListener("click", continueFromLevelUp);
    refs.wildcardContinueBtn.addEventListener("click", continueFromWildcard);
    refs.saveWriteupBtn.addEventListener("click", saveWriteup);
    refs.difficultyInputs.forEach((input) =>
      input.addEventListener("change", syncDifficultySelection)
    );
    refs.foodImage.addEventListener("error", showImagePlaceholder);
    refs.foodImage.addEventListener("load", showLoadedImage);
    syncDifficultySelection();
    showScreen("start");
  }

  function populateCountryDropdown() {
    const select = refs.playerCountry;
    if (!select) return;
    select.innerHTML = "";

    const arMeta = COUNTRY_META["argentina"];
    const arOpt = document.createElement("option");
    arOpt.value = "argentina";
    arOpt.textContent = arMeta.name;
    arOpt.selected = true;
    select.appendChild(arOpt);

    const others = Object.entries(COUNTRY_META)
      .filter(([key]) => key !== "argentina")
      .sort(([, a], [, b]) => a.name.localeCompare(b.name, "es"));

    for (const [key, meta] of others) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = meta.name;
      select.appendChild(opt);
    }
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
    state.sessionId = crypto.randomUUID();
    state.seenFoods = [];
    state.wildcardType = null;
    state.wildcardCorrect = null;
    state.playerCountry = refs.playerCountry?.value || "argentina";

    const db = getDb();
    if (db) {
      saveQuiet(db.from("sdm_sessions").insert([{
        session_id: state.sessionId,
        player_country: state.playerCountry,
        start_level: selectedLevel,
      }]));
    }

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
    const selectedDistractors = shuffle([...uniqueDistractors, ...fallback]).slice(0, 2);
    const options = shuffle([food.country, ...selectedDistractors]);

    return { food, level: levelKey, options, correctCountry: food.country };
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

    state.questionStartedAt = performance.now();

    const { food, level } = state.currentQuestion;
    refs.levelPill.textContent = "Nivel " + LEVEL_LABELS[level];
    refs.scoreLabel.textContent = "Puntaje: " + String(state.score);
    refs.livesLabel.textContent = "Vidas: " + ("❤️".repeat(state.lives) || "0");
    refs.foodName.textContent = food.food_name;
    setFoodImage(food.image, food.food_name);
    updateLevelProgress();

    refs.optionsGrid.innerHTML = "";
    state.currentQuestion.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-btn";
      const flag = getFlag(option);
      button.textContent = flag ? flag + " " + option : option;
      parseEmoji(button);
      button.addEventListener("click", () => handleAnswer(option));
      refs.optionsGrid.appendChild(button);
    });
  }

  function handleAnswer(selectedCountry) {
    const question = state.currentQuestion;
    if (!question) return;

    const reactionTimeMs = Math.round(performance.now() - state.questionStartedAt);
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

    if (!state.seenFoods.some((f) => getFoodId(f) === getFoodId(question.food))) {
      state.seenFoods.push(question.food);
    }

    state.lastAnswer = { isCorrect, selectedCountry, question, reactionTimeMs };

    const isLastRoundInLevel = state.roundIndex >= state.questions.length - 1;
    const hasNextLevel = state.levelIndex < LEVEL_ORDER.length - 1;
    state.outOfLives = state.lives <= 0;
    state.pendingLevelUp = !state.outOfLives && isLastRoundInLevel && hasNextLevel;
    state.pendingFinish = state.outOfLives || (isLastRoundInLevel && !hasNextLevel);

    const db = getDb();
    if (db) {
      saveQuiet(db.from("sdm_answers").insert([{
        session_id: state.sessionId,
        round_number: state.answered,
        level: question.level,
        food_name: question.food.food_name,
        correct_country: question.correctCountry,
        selected_country: selectedCountry,
        is_correct: isCorrect,
        is_wildcard: false,
        wildcard_type: null,
        reaction_time_ms: reactionTimeMs,
        lives_after: state.lives,
      }]));
    }

    showFeedback();
  }

  function maybeTriggerWildcard() {
    if (state.lives < 1 || state.lives > 2) return false;
    if (Math.random() >= 0.25) return false;

    const type = "country_from_flag";
    state.wildcardType = type;
    renderWildcard(type);
    showScreen("wildcard");
    return true;
  }

  function renderWildcard(type) {
    refs.wildcardResult.hidden = true;
    refs.wildcardResult.textContent = "";
    refs.wildcardContinueBtn.hidden = true;
    refs.wildcardGrid.innerHTML = "";

    if (type === "food_from_description") {
      const currentFoodId = getFoodId(state.currentQuestion.food);
      const pool = state.seenFoods.filter((f) => getFoodId(f) !== currentFoodId);
      const correctFood = randomItem(pool.length > 0 ? pool : state.seenFoods);
      const fact = getRandomFact(correctFood);
      state.wildcardCorrect = correctFood.food_name;

      refs.wildcardQuestion.innerHTML =
        '<p class="wildcard-fact-label">¿De qué comida habla este dato?</p>' +
        '<p class="wildcard-fact">“' + escapeHtml(fact) + '”</p>';

      const otherFoods = shuffle(
        (window.FOODS_DATA || []).filter((f) => getFoodId(f) !== getFoodId(correctFood))
      ).slice(0, 2).map((f) => f.food_name);

      shuffle([correctFood.food_name, ...otherFoods]).forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => handleWildcardAnswer(opt));
        refs.wildcardGrid.appendChild(btn);
      });

    } else {
      const allKeys = Object.keys(COUNTRY_META);
      const correctKey = randomItem(allKeys);
      const correctMeta = COUNTRY_META[correctKey];
      state.wildcardCorrect = correctMeta.name;

      refs.wildcardQuestion.innerHTML = "";
      const labelEl = document.createElement("p");
      labelEl.className = "wildcard-fact-label";
      labelEl.textContent = "¿De qué país es esta bandera?";
      const bigFlagEl = document.createElement("p");
      bigFlagEl.className = "wildcard-big-flag";
      bigFlagEl.textContent = correctMeta.flag;
      parseEmoji(bigFlagEl);
      refs.wildcardQuestion.appendChild(labelEl);
      refs.wildcardQuestion.appendChild(bigFlagEl);

      const otherKeys = shuffle(allKeys.filter((k) => k !== correctKey)).slice(0, 2);
      shuffle([correctMeta.name, ...otherKeys.map((k) => COUNTRY_META[k].name)]).forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => handleWildcardAnswer(opt));
        refs.wildcardGrid.appendChild(btn);
      });
    }
  }

  function handleWildcardAnswer(selected) {
    const buttons = refs.wildcardGrid.querySelectorAll("button");
    buttons.forEach((btn) => { btn.disabled = true; });

    const isCorrect = selected === state.wildcardCorrect;

    if (isCorrect) {
      state.lives = Math.min(3, state.lives + 1);
      refs.livesLabel.textContent = "Vidas: " + "❤️".repeat(state.lives);
      refs.wildcardResult.textContent = "¡Correcto! Ganaste una vida ❤️";
      refs.wildcardResult.className = "wildcard-result wildcard-result--win";
    } else {
      refs.wildcardResult.textContent =
        "¡Casi! No ganaste vida esta vez. Era: " + state.wildcardCorrect;
      refs.wildcardResult.className = "wildcard-result wildcard-result--lose";
    }

    const db = getDb();
    if (db) {
      saveQuiet(db.from("sdm_answers").insert([{
        session_id: state.sessionId,
        round_number: state.answered,
        level: LEVEL_ORDER[state.levelIndex],
        food_name: state.currentQuestion?.food?.food_name || "",
        correct_country: state.wildcardCorrect,
        selected_country: selected,
        is_correct: isCorrect,
        is_wildcard: true,
        wildcard_type: state.wildcardType,
        reaction_time_ms: 0,
        lives_after: state.lives,
      }]));
    }

    refs.wildcardResult.hidden = false;
    refs.wildcardContinueBtn.hidden = false;
  }

  function continueFromWildcard() {
    state.wildcardType = null;
    state.wildcardCorrect = null;

    if (state.pendingLevelUp) {
      showLevelUp();
      return;
    }

    // Re-evaluate outOfLives with current lives (might have recovered via wildcard win)
    state.outOfLives = state.lives <= 0;
    const isLastRoundOfLastLevel =
      state.roundIndex >= state.questions.length - 1 &&
      state.levelIndex >= LEVEL_ORDER.length - 1;

    if (state.outOfLives || isLastRoundOfLastLevel) {
      state.pendingFinish = false;
      showFinal();
      return;
    }

    state.outOfLives = false;
    state.pendingFinish = false;
    state.roundIndex += 1;
    renderQuestion();
    showScreen("game");
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

    const flag = getFlag(answer.question.correctCountry);
    const label = answer.question.food.answer_label || ("Respuesta correcta: ");
    refs.feedbackAnswer.textContent =
      label + " " + (flag ? flag + " " : "") + answer.question.correctCountry;
    parseEmoji(refs.feedbackAnswer);
    refs.feedbackFunFact.textContent =
      "¿Sabías qué? " + getRandomFact(answer.question.food);

    if (state.pendingFinish) {
      refs.nextRoundBtn.textContent = "Ver resultado final";
    } else if (state.pendingLevelUp) {
      refs.nextRoundBtn.textContent = "Continuar";
    } else {
      refs.nextRoundBtn.textContent = "Siguiente ronda";
    }

    updateLevelProgress();
    showScreen("feedback");
    renderCountryMap(answer.question.correctCountry);
  }

  function renderCountryMap(countryName) {
    const meta = COUNTRY_META[normalizeCountry(countryName)];

    if (refs.countryMapCaption) {
      const flag = getFlag(countryName);
      refs.countryMapCaption.textContent =
        "¿Sabías dónde queda " + (flag ? flag + " " : "") + countryName + "?";
      parseEmoji(refs.countryMapCaption);
    }

    if (!meta || typeof window.jsVectorMap === "undefined") {
      refs.countryMap.textContent =
        "Mapa no disponible para este país en este momento.";
      return;
    }

    if (state.mapInstance && typeof state.mapInstance.destroy === "function") {
      try { state.mapInstance.destroy(); } catch (_) {}
      state.mapInstance = null;
    }

    refs.countryMap.innerHTML = "";

    const markers = [];
    if (SMALL_COUNTRY_CODES.has(meta.iso) && Array.isArray(meta.coords)) {
      markers.push({ name: countryName, coords: meta.coords });
    }

    try {
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
          hover: { fill: "#8ec2ff" },
          selected: { fill: "#ff8c42" },
          selectedHover: { fill: "#ff8c42" },
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
          hover: { fill: "#ff2f53" },
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
    if (maybeTriggerWildcard()) return;

    if (state.pendingLevelUp) {
      showLevelUp();
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

  function showLevelUp() {
    const nextLevel = LEVEL_ORDER[state.levelIndex + 1];
    const nextLabel = LEVEL_LABELS[nextLevel];
    if (refs.levelUpTitle) {
      refs.levelUpTitle.textContent = "¡Pasaste a " + nextLabel + "!";
    }
    showScreen("levelup");
  }

  function continueFromLevelUp() {
    state.levelIndex += 1;
    state.pendingLevelUp = false;
    buildQuestionsForCurrentLevel();
    renderQuestion();
    showScreen("game");
  }

  function showFinal() {
    refs.finalSummary.textContent = "Puntaje final: " + String(state.score) + " puntos";
    refs.finalDetails.textContent = "";

    if (refs.finalText) refs.finalText.value = "";
    if (refs.finalText) refs.finalText.hidden = false;
    if (refs.saveWriteupBtn) refs.saveWriteupBtn.hidden = false;
    if (refs.writeupStatus) refs.writeupStatus.hidden = true;

    showScreen("final");
  }

  function saveWriteup() {
    const text = refs.finalText?.value?.trim() || "";
    if (!text) {
      refs.finalText?.classList.add("shake");
      setTimeout(() => refs.finalText?.classList.remove("shake"), 400);
      return;
    }

    const db = getDb();
    if (db && state.sessionId) {
      saveQuiet(db.from("sdm_final_writeups").insert([{
        session_id: state.sessionId,
        text: text.slice(0, 2000),
        hits: state.hits,
        rounds: state.answered,
        out_of_lives: state.outOfLives,
      }]));
    }

    if (refs.finalText) refs.finalText.hidden = true;
    if (refs.saveWriteupBtn) refs.saveWriteupBtn.hidden = true;
    if (refs.writeupStatus) refs.writeupStatus.hidden = false;
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
    buttons.forEach((button) => { button.disabled = true; });
  }

  function updateLevelProgress() {
    const ratio = Math.max(
      0,
      Math.min(1, state.levelAnswered / ROUNDS_PER_LEVEL)
    );
    refs.progressFill.style.width = String(ratio * 100) + "%";
  }

  function getRandomFact(food) {
    return food.fun_fact || "";
  }

  function getFoodId(food) {
    return String(food?.food_name || "").trim().toLowerCase();
  }

  function normalizeCountry(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
