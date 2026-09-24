import express from "express";
import { readFile } from "node:fs/promises";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("."));

app.get("/", async (req, res) => {
  try {
    const html = await readFile(
      process.cwd() + "/Air-AI_version7_local_AI.html",
      "utf8"
    );

    const updatedHtml = html.replace(
      /<\/body>/i,
      '<script src="/integrate-search.js"></script></body>'
    );

    res.send(updatedHtml);
  } catch (error) {
    console.error("Не удалось открыть главную страницу:", error);
    res.status(500).send("Ошибка загрузки Air-AI");
  }
});

// Города → аэропорты назначения.
// Пулково всегда является аэропортом отправления: LED.
const DESTINATIONS = {
  "москва": ["SVO", "DME", "VKO", "ZIA"],
  "санкт-петербург": ["LED"],
  "сочи": ["AER"],
  "екатеринбург": ["SVX"],
  "казань": ["KZN"],
  "новосибирск": ["OVB"],
  "краснодар": ["KRR"],
  "ростов": ["ROV"],
  "ростов-на-дону": ["ROV"],
  "самара": ["KUF"],
  "уфа": ["UFA"],
  "минеральные воды": ["MRV"],
  "калининград": ["KGD"],
  "мурманск": ["MMK"],
  "архангельск": ["ARH"],
  "махачкала": ["MCX"],
  "владикавказ": ["OGZ"],
  "тюмень": ["TJM"],
  "омск": ["OMS"],
  "иркутск": ["IKT"],
  "владивосток": ["VVO"],
  "хабаровск": ["KHV"],
  "баку": ["GYD"],
  "ташкент": ["TAS"],
  "дубай": ["DXB"],
  "стамбул": ["IST", "SAW"],
  "ереван": ["EVN"],
  "минск": ["MSQ"],
  "астана": ["NQZ"],
  "алматы": ["ALA"],
  "париж": ["CDG", "ORY"],
  "лондон": ["LHR", "LGW", "STN"],
  "берлин": ["BER"],
  "рим": ["FCO"],
  "милан": ["MXP", "LIN"],
  "барселона": ["BCN"],
  "прага": ["PRG"],
  "вена": ["VIE"]
};

function normalizeCity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

function formatFlight(flight) {
  return {
    flightNumber:
      flight?.flight?.iata ||
      flight?.flight?.icao ||
      null,

    airline:
      flight?.airline?.name ||
      flight?.airline?.iata ||
      null,

    departure: {
      airport: flight?.departure?.airport || null,
      iata: flight?.departure?.iata || null,
      scheduled: flight?.departure?.scheduled || null,
      estimated: flight?.departure?.estimated || null,
      actual: flight?.departure?.actual || null
    },

    arrival: {
      airport: flight?.arrival?.airport || null,
      iata: flight?.arrival?.iata || null,
      scheduled: flight?.arrival?.scheduled || null,
      estimated: flight?.arrival?.estimated || null,
      actual: flight?.arrival?.actual || null
    },

    status: flight?.flight_status || null
  };
}

app.get("/api/flight", async (req, res) => {
  try {
    const apiKey = process.env.AVIATIONSTACK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        flight: null,
        source: "Aviationstack",
        error: "AVIATIONSTACK_API_KEY is not configured on Render."
      });
    }

    const cityInput = req.query.city;
    const city = normalizeCity(cityInput);

    if (!city) {
      return res.status(400).json({
        flight: null,
        source: "Aviationstack",
        error: "Destination city is required."
      });
    }

    const destinationAirports = DESTINATIONS[city];

    if (!destinationAirports) {
      return res.status(404).json({
        flight: null,
        source: "Aviationstack",
        searchedCity: cityInput,
        error:
          "City is not in the destination database yet.",
        availableCities: Object.keys(DESTINATIONS)
      });
    }

    const results = [];

    // Пулково всегда LED.
    // Делаем отдельный запрос для каждого аэропорта назначения.
    for (const arrIata of destinationAirports) {
      const url = new URL("https://api.aviationstack.com/v1/flights");

      url.searchParams.set("access_key", apiKey);
      url.searchParams.set("dep_iata", "LED");
      url.searchParams.set("arr_iata", arrIata);
      url.searchParams.set("limit", "100");

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok || data?.error) {
        return res.status(502).json({
          flight: null,
          source: "Aviationstack",
          searchedCity: cityInput,
          destinationAirport: arrIata,
          error: data?.error || `HTTP ${response.status}`
        });
      }

      if (Array.isArray(data?.data)) {
        results.push(...data.data);
      }
    }

    if (results.length === 0) {
      return res.json({
        flight: null,
        source: "Aviationstack",
        searchedCity: cityInput,
        from: "LED",
        destinationAirports,
        totalFlightsReceived: 0,
        note:
          "No current flight found from Pulkovo (LED) to the selected destination."
      });
    }

    // Берём первый найденный рейс.
    const flight = results[0];

    return res.json({
      flight: formatFlight(flight),
      source: "Aviationstack",
      searchedCity: cityInput,
      from: "LED",
      destinationAirports,
      totalFlightsReceived: results.length
    });

  } catch (error) {
    console.error("Flight API error:", error);

    return res.status(500).json({
      flight: null,
      source: "Aviationstack",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Air-AI Aviationstack API listening on :${PORT}`);
});
