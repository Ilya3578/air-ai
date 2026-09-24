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
  "москва": ["SVO", "DME", "VKO", "ZIA"],
  "moscow": ["SVO", "DME", "VKO", "ZIA"],
  "moskva": ["SVO", "DME", "VKO", "ZIA"],
  "санкт-петербург": ["LED"],
  "saint petersburg": ["LED"],
  "st petersburg": ["LED"],
  "сочи": ["AER"],
  "sochi": ["AER"],
  "екатеринбург": ["SVX"],
  "yekaterinburg": ["SVX"],
  "казань": ["KZN"],
  "kazan": ["KZN"],
  "новосибирск": ["OVB"],
  "novosibirsk": ["OVB"],
  "краснодар": ["KRR"],
  "krasnodar": ["KRR"],
  "ростов": ["ROV"],
  "ростов-на-дону": ["ROV"],
  "rostov": ["ROV"],
  "rostov-on-don": ["ROV"],
  "самара": ["KUF"],
  "samara": ["KUF"],
  "уфа": ["UFA"],
  "ufa": ["UFA"],
  "минеральные воды": ["MRV"],
  "mineralnye vody": ["MRV"],
  "калининград": ["KGD"],
  "kaliningrad": ["KGD"],
  "мурманск": ["MMK"],
  "murmansk": ["MMK"],
  "архангельск": ["ARH"],
  "arkhangelsk": ["ARH"],
  "махачкала": ["MCX"],
  "makhachkala": ["MCX"],
  "владикавказ": ["OGZ"],
  "vladikavkaz": ["OGZ"],
  "тюмень": ["TJM"],
  "tyumen": ["TJM"],
  "омск": ["OMS"],
  "omsk": ["OMS"],
  "иркутск": ["IKT"],
  "irkutsk": ["IKT"],
  "владивосток": ["VVO"],
  "vladivostok": ["VVO"],
  "хабаровск": ["KHV"],
  "khabarovsk": ["KHV"],
  "пермь": ["PEE"],
  "perm": ["PEE"],
  "волгоград": ["VOG"],
  "volgograd": ["VOG"],
  "нижний новгород": ["GOJ"],
  "nizhny novgorod": ["GOJ"],
  "челябинск": ["CEK"],
  "chelyabinsk": ["CEK"],
  "сургут": ["SGC"],
  "surgut": ["SGC"],
  "томск": ["TOF"],
  "tomsk": ["TOF"],
  "якутск": ["YKS"],
  "yakutsk": ["YKS"],
  "грозный": ["GRV"],
  "grozny": ["GRV"],
  "ижевск": ["IJK"],
  "izhevsk": ["IJK"],
  "пенза": ["PEZ"],
  "penza": ["PEZ"],
  "оренбург": ["REN"],
  "orenburg": ["REN"],
  "ставрополь": ["STW"],
  "stavropol": ["STW"],
  "воронеж": ["VOZ"],
  "voronezh": ["VOZ"],
  "череповец": ["CEE"],
  "cherepovets": ["CEE"],
  "геленджик": ["GDZ"],
  "gelendzhik": ["GDZ"],

  // Турция
  "стамбул": ["IST", "SAW"],
  "istanbul": ["IST", "SAW"],
  "анталья": ["AYT"],
  "antalya": ["AYT"],
  "анкара": ["ESB"],
  "ankara": ["ESB"],
  "измир": ["ADB"],
  "izmir": ["ADB"],
  "бодрум": ["BJV"],
  "bodrum": ["BJV"],
  "даламан": ["DLM"],
  "dalaman": ["DLM"],

  // ОАЭ
  "дубай": ["DXB", "DWC"],
  "dubai": ["DXB", "DWC"],
  "абу-даби": ["AUH"],
  "abu dhabi": ["AUH"],
  "шарджа": ["SHJ"],
  "sharjah": ["SHJ"],

  // Кавказ
  "баку": ["GYD"],
  "baku": ["GYD"],
  "ереван": ["EVN"],
  "yerevan": ["EVN"],
  "тбилиси": ["TBS"],
  "tbilisi": ["TBS"],
  "батуми": ["BUS"],
  "batumi": ["BUS"],

  // Центральная Азия
  "ташкент": ["TAS"],
  "tashkent": ["TAS"],
  "самарканд": ["SKD"],
  "samarkand": ["SKD"],
  "бухара": ["BHK"],
  "bukhara": ["BHK"],
  "алматы": ["ALA"],
  "almaty": ["ALA"],
  "астана": ["NQZ"],
  "astana": ["NQZ"],
  "душанбе": ["DYU"],
  "dushanbe": ["DYU"],
  "бишкек": ["BSZ"],
  "bishkek": ["BSZ"],
  "ош": ["OSS"],
  "osh": ["OSS"],

  // Беларусь
  "минск": ["MSQ"],
  "minsk": ["MSQ"],

  // Европа
  "париж": ["CDG", "ORY"],
  "paris": ["CDG", "ORY"],
  "лондон": ["LHR", "LGW", "STN"],
  "london": ["LHR", "LGW", "STN"],
  "берлин": ["BER"],
  "berlin": ["BER"],
  "рим": ["FCO"],
  "rome": ["FCO"],
  "милан": ["MXP", "LIN"],
  "milan": ["MXP", "LIN"],
  "барселона": ["BCN"],
  "barcelona": ["BCN"],
  "прага": ["PRG"],
  "prague": ["PRG"],
  "вена": ["VIE"],
  "vienna": ["VIE"],
  "белград": ["BEG"],
  "belgrade": ["BEG"],
  "афины": ["ATH"],
  "athens": ["ATH"],
  "амстердам": ["AMS"],
  "amsterdam": ["AMS"],
  "цюрих": ["ZRH"],
  "zurich": ["ZRH"],
  "женева": ["GVA"],
  "geneva": ["GVA"],
  "будапешт": ["BUD"],
  "budapest": ["BUD"],
  "варшава": ["WAW"],
  "warsaw": ["WAW"],
  "брюссель": ["BRU"],
  "brussels": ["BRU"],
  "стокгольм": ["ARN"],
  "stockholm": ["ARN"],
  "хельсинки": ["HEL"],
  "helsinki": ["HEL"],
  "копенгаген": ["CPH"],
  "copenhagen": ["CPH"],
  "осло": ["OSL"],
  "oslo": ["OSL"],
  "таллин": ["TLL"],
  "tallinn": ["TLL"],
  "рига": ["RIX"],
  "riga": ["RIX"],
  "вильнюс": ["VNO"],
  "vilnius": ["VNO"],

  // Азия
  "пекин": ["PEK", "PKX"],
  "beijing": ["PEK", "PKX"],
  "шанхай": ["PVG", "SHA"],
  "shanghai": ["PVG", "SHA"],
  "чэнду": ["TFU", "CTU"],
  "chengdu": ["TFU", "CTU"],
  "санья": ["SYX"],
  "sanya": ["SYX"],
  "бангкок": ["BKK", "DMK"],
  "bangkok": ["BKK", "DMK"],
  "пхукет": ["HKT"],
  "phuket": ["HKT"],
  "мале": ["MLE"],
  "male": ["MLE"],
  "гоа": ["GOI", "GOX"],
  "goa": ["GOI", "GOX"],
  "дели": ["DEL"],
  "delhi": ["DEL"],
  "мумбаи": ["BOM"],
  "mumbai": ["BOM"],
  "ханой": ["HAN"],
  "hanoi": ["HAN"],
  "хошимин": ["SGN"],
  "ho chi minh": ["SGN"],
  "гонконг": ["HKG"],
  "hong kong": ["HKG"],
  "токио": ["HND", "NRT"],
  "tokyo": ["HND", "NRT"],
  "сеул": ["ICN", "GMP"],
  "seoul": ["ICN", "GMP"],
  "кота-кинабалу": ["BKI"],
  "kota kinabalu": ["BKI"],

  // Ближний Восток
  "доха": ["DOH"],
  "doha": ["DOH"],
  "эр-рияд": ["RUH"],
  "riyadh": ["RUH"],
  "тель-авив": ["TLV"],
  "tel aviv": ["TLV"],
  "амман": ["AMM"],
  "amman": ["AMM"],

  // Африка
  "хургада": ["HRG"],
  "hurghada": ["HRG"],
  "шарм-эш-шейх": ["SSH"],
  "sharm el sheikh": ["SSH"],
  "касабланка": ["CMN"],
  "casablanca": ["CMN"],
  "монастир": ["MIR"],
  "monastir": ["MIR"]
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
