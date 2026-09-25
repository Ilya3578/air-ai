
(() => {
  const cityInput = [...document.querySelectorAll("input")]
    .find(el =>
      (el.placeholder || "").toLowerCase().includes("город прилёта")
    );

  const searchButton = [...document.querySelectorAll("button")]
    .find(el => el.textContent.trim().includes("Найти рейс"));

  if (!cityInput || !searchButton) {
    console.error("Air-AI: поле города или кнопка не найдены.");
    return;
  }

  const result = document.createElement("div");
  result.style.cssText =
    "margin-top:20px;padding:18px;border-radius:12px;background:#f3f5f7;";

  searchButton.insertAdjacentElement("afterend", result);

  function isEnglish() {
    return document.documentElement.lang
      .toLowerCase()
      .startsWith("en");
  }

  function getLimitMessage() {
    return isEnglish()
      ? "Upgrade to the Smart, Family, Pro, or First Class plan"
      : "Перейдите на тариф Smart, Family, Pro или First Class";
  }

  function formatTime(value) {
    if (!value) return "Пока неизвестно";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const statuses = {
    scheduled: "Запланирован",
    active: "В полёте",
    landed: "Приземлился",
    cancelled: "Отменён",
    diverted: "Перенаправлен",
    incident: "Инцидент"
  };

  searchButton.addEventListener("click", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const city = cityInput.value.trim();

    if (!city) {
      result.textContent = isEnglish()
        ? "Enter the arrival city."
        : "Введите город прилёта.";
      return;
    }

    searchButton.disabled = true;
    result.textContent = isEnglish()
      ? "Searching for your flight…"
      : "Ищем рейс из Пулково…";

    try {
      const response = await fetch(
        "/api/flight?city=" + encodeURIComponent(city)
      );

      const data = await response.json();

      if (
        data?.error?.code === "usage_limit_reached" ||
        data?.flight === null &&
        data?.error?.code === "usage_limit_reached"
      ) {
        result.textContent = getLimitMessage();
        return;
      }

      if (!response.ok) {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Ошибка поиска";

        throw new Error(errorMessage);
      }

      if (!data.flight) {
        result.textContent =
          data.note ||
          (isEnglish()
            ? "Flight not found. Try another city."
            : "Рейс не найден. Попробуйте другой город.");
        return;
      }

      const f = data.flight;

      result.replaceChildren();

      const title = document.createElement("h3");
      title.textContent =
        `✈️ Пулково (LED) → ${f.arrival.iata || city}`;
      result.append(title);

      const rows = [
        ["Рейс", f.flightNumber],
        ["Авиакомпания", f.airline],

        ["Вылет", formatTime(
          f.departure.scheduled || f.departure.estimated
        )],

        ["Прилёт", formatTime(
          f.arrival.scheduled || f.arrival.estimated
        )],

        ["Аэропорт прибытия", f.arrival.airport],

        ["Терминал",
          f.departure.terminal || "Пока нет информации о терминале"],

        ["Стойка регистрации",
          f.departure.checkInCounter || "Пока нет информации о стойке"],

        ["Гейт",
          f.departure.gate || "Пока нет информации о гейте"],

        ["Статус", statuses[f.status] || f.status],

        ["Тип воздушного судна",
          f.aircraft?.iata ||
          f.aircraft?.icao ||
          "Пока нет информации о самолёте"]
      ];

      for (const [label, value] of rows) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = label + ": ";
        p.append(strong, document.createTextNode(value || "Пока неизвестно"));
        result.append(p);
      }
    } catch (error) {
      result.textContent = isEnglish()
        ? "Search error: " + error.message
        : "Ошибка поиска: " + error.message;
    } finally {
      searchButton.disabled = false;
    }
  }, true);
})();
