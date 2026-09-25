```javascript
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
    return document.documentElement.lang.toLowerCase() === "en";
  }

  function getText(ru, en) {
    return isEnglish() ? en : ru;
  }

  function unknown() {
    return getText(
      "Пока нет информации",
      "Information not available yet"
    );
  }

  function formatTime(value) {
    if (!value) return unknown();

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      isEnglish() ? "en-GB" : "ru-RU",
      {
        timeZone: "Europe/Moscow",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  const statuses = {
    scheduled: {
      ru: "Запланирован",
      en: "Scheduled"
    },
    active: {
      ru: "В полёте",
      en: "In flight"
    },
    landed: {
      ru: "Приземлился",
      en: "Landed"
    },
    cancelled: {
      ru: "Отменён",
      en: "Cancelled"
    },
    diverted: {
      ru: "Перенаправлен",
      en: "Diverted"
    },
    incident: {
      ru: "Инцидент",
      en: "Incident"
    }
  };

  function formatStatus(status) {
    if (!status) return unknown();

    const item = statuses[String(status).toLowerCase()];

    if (!item) return status;

    return getText(item.ru, item.en);
  }

  function renderMessage(ru, en) {
    result.textContent = getText(ru, en);
  }

  searchButton.addEventListener("click", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const city = cityInput.value.trim();

    if (!city) {
      renderMessage(
        "Введите город прилёта.",
        "Enter the arrival city."
      );
      return;
    }

    searchButton.disabled = true;

    renderMessage(
      "Ищем рейс из Пулково…",
      "Searching for a flight from Pulkovo…"
    );

    try {
      const response = await fetch(
        "/api/flight?city=" + encodeURIComponent(city)
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          getText("Ошибка поиска", "Search error")
        );
      }

      if (!data.flight) {
        result.textContent =
          data.note ||
          getText(
            "Рейс не найден. Попробуйте другой город.",
            "Flight not found. Try another city."
          );

        return;
      }

      const f = data.flight;

      result.replaceChildren();

      const title = document.createElement("h3");

      title.textContent =
        `✈️ ${getText("Пулково", "Pulkovo")} (LED) → ${
          f.arrival.iata || city
        }`;

      result.append(title);

      const rows = [
        [
          getText("Рейс", "Flight"),
          f.flightNumber || unknown()
        ],

        [
          getText("Авиакомпания", "Airline"),
          f.airline || unknown()
        ],

        [
          getText("Вылет", "Departure"),
          formatTime(
            f.departure.scheduled ||
            f.departure.estimated
          )
        ],

        [
          getText("Прилёт", "Arrival"),
          formatTime(
            f.arrival.scheduled ||
            f.arrival.estimated
          )
        ],

        [
          getText(
            "Аэропорт прибытия",
            "Arrival airport"
          ),
          f.arrival.airport || unknown()
        ],

        [
          getText("Терминал", "Terminal"),
          f.departure.terminal || unknown()
        ],

        [
          getText(
            "Стойка регистрации",
            "Check-in counter"
          ),
          f.departure.checkInCounter || unknown()
        ],

        [
          getText("Гейт", "Gate"),
          f.departure.gate || unknown()
        ],

        [
          getText("Статус", "Status"),
          formatStatus(f.status)
        ],

        [
          getText(
            "Тип воздушного судна",
            "Aircraft type"
          ),
          f.aircraft?.iata ||
          f.aircraft?.icao ||
          unknown()
        ]
      ];

      for (const [label, value] of rows) {
        const p = document.createElement("p");

        const strong = document.createElement("strong");

        strong.textContent = label + ": ";

        p.append(
          strong,
          document.createTextNode(
            value || unknown()
          )
        );

        result.append(p);
      }

    } catch (error) {
      result.textContent =
        getText(
          "Ошибка поиска: ",
          "Search error: "
        ) + error.message;

    } finally {
      searchButton.disabled = false;
    }
  }, true);
})();
```
