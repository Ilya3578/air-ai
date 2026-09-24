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
  // Россия
  "москва": "SVO",
  "moscow": "SVO",
  "moskva": "SVO",

  "санкт-петербург": "LED",
  "saint petersburg": "LED",
  "st petersburg": "LED",
  "st. petersburg": "LED",

  "сочи": "AER",
  "sochi": "AER",
  "адлер": "AER",
  "adler": "AER",

  "калининград": "KGD",
  "kaliningrad": "KGD",
  "екатеринбург": "SVX",
  "yekaterinburg": "SVX",
  "екатеринбург": "SVX",
  "кazan": "KZN",
  "казань": "KZN",
  "kazan": "KZN",
  "самара": "KUF",
  "samara": "KUF",
  "уфа": "UFA",
  "ufa": "UFA",
  "новосибирск": "OVB",
  "novosibirsk": "OVB",
  "мурманск": "MMK",
  "murmansk": "MMK",
  "пермь": "PEE",
  "perm": "PEE",
  "тюмень": "TJM",
  "tyumen": "TJM",
  "волгоград": "VOG",
  "volgograd": "VOG",
  "нижний новгород": "GOJ",
  "nizhny novgorod": "GOJ",
  "краснодар": "KRR",
  "krasnodar": "KRR",
  "минеральные воды": "MRV",
  "mineralnye vody": "MRV",
  "минводы": "MRV",
  "minvody": "MRV",
  "ростов-на-дону": "ROV",
  "rostov-on-don": "ROV",
  "иркутск": "IKT",
  "irkutsk": "IKT",
  "омск": "OMS",
  "omsk": "OMS",
  "томск": "TOF",
  "tomsk": "TOF",
  "челябинск": "CEK",
  "chelyabinsk": "CEK",
  "воронеж": "VOZ",
  "voronezh": "VOZ",
  "архангельск": "ARH",
  "arkhangelsk": "ARH",
  "сургут": "SGC",
  "surgut": "SGC",
  "якутск": "YKS",
  "yakutsk": "YKS",
  "владивосток": "VVO",
  "vladivostok": "VVO",
  "грозный": "GRV",
  "grozny": "GRV",
  "ижевск": "IJK",
  "izhevsk": "IJK",
  "киров": "KVX",
  "kirov": "KVX",
  "пенза": "PEZ",
  "penza": "PEZ",
  "оренбург": "REN",
  "orenburg": "REN",
  "саратов": "GSV",
  "saratov": "GSV",
  "ставрополь": "STW",
  "stavropol": "STW",
  "владикавказ": "OGZ",
  "vladikavkaz": "OGZ",
  "нарьян-мар": "NNM",
  "naryan-mar": "NNM",
  "череповец": "CEE",
  "cherepovets": "CEE",
  "геленджик": "GDZ",
  "gelendzhik": "GDZ",

  // Турция
  "стамбул": "IST",
  "istanbul": "IST",
  "анталья": "AYT",
  "antalya": "AYT",
  "анкара": "ESB",
  "ankara": "ESB",
  "измир": "ADB",
  "izmir": "ADB",
  "бодрум": "BJV",
  "bodrum": "BJV",
  "даламан": "DLM",
  "dalaman": "DLM",

  // ОАЭ
  "дубай": "DXB",
  "dubai": "DXB",
  "абу-даби": "AUH",
  "abu dhabi": "AUH",
  "шарджа": "SHJ",
  "sharjah": "SHJ",

  // Азия
  "пекин": "PEK",
  "beijing": "PEK",
  "шанхай": "PVG",
  "shanghai": "PVG",
  "чэнду": "TFU",
  "chengdu": "TFU",
  "санья": "SYX",
  "sanya": "SYX",
  "бангкок": "BKK",
  "bangkok": "BKK",
  "пхукет": "HKT",
  "phuket": "HKT",
  "мале": "MLE",
  "male": "MLE",
  "гоа": "GOI",
  "goa": "GOI",

  // Центральная Азия
  "ташкент": "TAS",
  "tashkent": "TAS",
  "самарканд": "SKD",
  "samarkand": "SKD",
  "бухара": "BHK",
  "bukhara": "BHK",
  "фергана": "FEG",
  "fergana": "FEG",
  "ургенч": "UGC",
  "urgench": "UGC",
  "алматы": "ALA",
  "almaty": "ALA",
  "астана": "NQZ",
  "astana": "NQZ",
  "баку": "GYD",
  "baku": "GYD",
  "душанбе": "DYU",
  "dushanbe": "DYU",
  "худжанд": "LBD",
  "khujand": "LBD",

  // Кавказ
  "ереван": "EVN",
  "yerevan": "EVN",
  "тбилиси": "TBS",
  "tbilisi": "TBS",
  "батуми": "BUS",
  "batumi": "BUS",
  "сухум": "SUI",
  "sukhumi": "SUI",

  // Европа и соседние страны
  "минск": "MSQ",
  "minsk": "MSQ",
  "брест": "BQT",
  "brest": "BQT",
  "гомель": "GME",
  "gomel": "GME",
  "белград": "BEG",
  "belgrade": "BEG",
  "стамбул сабиха": "SAW",
  "istanbul sabiha": "SAW",

  // Африка и Ближний Восток
  "хургада": "HRG",
  "hurghada": "HRG",
  "шарм-эш-шейх": "SSH",
  "sharm el sheikh": "SSH",
  "касабланка": "CMN",
  "casablanca": "CMN",
  "монастир": "MIR",
  "monastir": "MIR"
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
  actual: flight?.departure?.actual || null,

  terminal: flight?.departure?.terminal || null,
  gate: flight?.departure?.gate || null,

  checkInCounter:
    flight?.departure?.check_in_counter ||
    flight?.departure?.checkin_counter ||
    null
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
