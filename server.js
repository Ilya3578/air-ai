
import express from "express";
import { readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_PASSWORD = process.env.SITE_PASSWORD;

if (!SITE_PASSWORD) {
  throw new Error("SITE_PASSWORD is not configured on Render");
}

app.use((req, res, next) => {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Basic\s+(.+)$/i);

  if (!match) {
    res.set(
      "WWW-Authenticate",
      'Basic realm="Air-AI Assistant", charset="UTF-8"'
    );
    return res.status(401).send("Enter password to access Air-AI Assistant.");
  }

  let credentials;

  try {
    credentials = Buffer.from(match[1], "base64").toString("utf8");
  } catch {
    res.set(
      "WWW-Authenticate",
      'Basic realm="Air-AI Assistant"'
    );
    return res.status(401).send("Invalid credentials.");
  }

  const separator = credentials.indexOf(":");

  if (separator < 0) {
    return res.status(401).send("Invalid credentials.");
  }

  const username = credentials.slice(0, separator);
  const password = credentials.slice(separator + 1);

  const expected = Buffer.from(SITE_PASSWORD, "utf8");
  const supplied = Buffer.from(password, "utf8");

  const validPassword =
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied);

  if (username !== "airai" || !validPassword) {
    res.set(
      "WWW-Authenticate",
      'Basic realm="Air-AI Assistant"'
    );
    return res.status(401).send("Incorrect username or password.");
  }

  next();
});

app.use(express.static("."));

app.get("/", async (req, res) => {
  try {
    const html = await readFile(
      process.cwd() + "/Air-AI_version7_local_AI.html",
      "utf8"
    );

    // The HTML already contains the current flight-search handler.
    // Do not inject the legacy integrate-search.js: it intercepts the form,
    // sends only the city, and hard-codes Pulkovo in its status/result UI.
    res.send(html);
  } catch (error) {
    console.error("Не удалось открыть главную страницу:", error);
    res.status(500).send("Ошибка загрузки Air-AI");
  }
});

// Города → аэропорты назначения.
// Аэропорт вылета передаётся из выбранного пользователем табло.
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
  "monastir": ["MIR"],

  // Дополнительные города: Европа
  "мадрид": ["MAD"], "madrid": ["MAD"],
  "лиссабон": ["LIS"], "lisbon": ["LIS"],
  "манчестер": ["MAN"], "manchester": ["MAN"],
  "эдinburgh": ["EDI"], "edinburgh": ["EDI"],
  "дублин": ["DUB"], "dublin": ["DUB"],
  "франкфурт": ["FRA"], "frankfurt": ["FRA"],
  "мюнхен": ["MUC"], "munich": ["MUC"],
  "гамбург": ["HAM"], "hamburg": ["HAM"],
  "дюссельдорф": ["DUS"], "dusseldorf": ["DUS"],
  "кёльн": ["CGN"], "колон": ["CGN"], "cologne": ["CGN"],
  "ницца": ["NCE"], "nice": ["NCE"],
  "марсель": ["MRS"], "marseille": ["MRS"],
  "лион": ["LYS"], "lyon": ["LYS"],
  "флоренция": ["FLR"], "florence": ["FLR"],
  "неаполь": ["NAP"], "naples": ["NAP"],
  "венеция": ["VCE"], "venice": ["VCE"],
  "болонья": ["BLQ"], "bologna": ["BLQ"],
  "афины": ["ATH"], "athens": ["ATH"],
  "салоники": ["SKG"], "thessaloniki": ["SKG"],
  "ларнака": ["LCA"], "larnaca": ["LCA"],
  "пафос": ["PFO"], "paphos": ["PFO"],
  "антверпен": ["ANR"], "antwerp": ["ANR"],
  "люксембург": ["LUX"], "luxembourg": ["LUX"],
  "рейкьявик": ["KEF"], "reykjavik": ["KEF"],
  "гётеборг": ["GOT"], "gothenburg": ["GOT"],
  "берген": ["BGO"], "bergen": ["BGO"],
  "турку": ["TKU"], "turku": ["TKU"],
  "тампере": ["TMP"], "tampere": ["TMP"],
  "краков": ["KRK"], "krakow": ["KRK"],
  "гданьск": ["GDN"], "gdansk": ["GDN"],
  "катовице": ["KTW"], "katowice": ["KTW"],
  "братислава": ["BTS"], "bratislava": ["BTS"],
  "любляна": ["LJU"], "ljubljana": ["LJU"],
  "загреб": ["ZAG"], "zagreb": ["ZAG"],
  "сплит": ["SPU"], "split": ["SPU"],
  "дубровник": ["DBV"], "dubrovnik": ["DBV"],
  "сараево": ["SJJ"], "sarajevo": ["SJJ"],
  "подгорица": ["TGD"], "podgorica": ["TGD"],
  "тирana": ["TIA"], "tirana": ["TIA"],
  "софия": ["SOF"], "sofia": ["SOF"],
  "букурешт": ["OTP"], "bucharest": ["OTP"],
  "клуж": ["CLJ"], "cluj": ["CLJ"],
  "кишинёв": ["RMO"], "chisinau": ["RMO"],
  "одесса": ["ODS"], "odesa": ["ODS"],
  "львов": ["LWO"], "lviv": ["LWO"],
  "киев": ["KBP", "IEV"], "kyiv": ["KBP", "IEV"],
  "стамбул новый аэропорт": ["IST"], "istanbul airport": ["IST"],

  // Дополнительные города: Ближний Восток и Африка
  "кувейт": ["KWI"], "kuwait": ["KWI"],
  "манама": ["BAH"], "manama": ["BAH"],
  "маскат": ["MCT"], "muscat": ["MCT"],
  "джидда": ["JED"], "jeddah": ["JED"],
  "медина": ["MED"], "medina": ["MED"],
  "дубай аль-мактум": ["DWC"],
  "александрия": ["HBE", "ALY"], "alexandria": ["HBE", "ALY"],
  "каир": ["CAI"], "cairo": ["CAI"],
  "найроби": ["NBO"], "nairobi": ["NBO"],
  "аддис-абеба": ["ADD"], "addis ababa": ["ADD"],
  "дар-эс-салам": ["DAR"], "dar es salaam": ["DAR"],
  "зanzibar": ["ZNZ"], "zanzibar": ["ZNZ"],
  "кейптаун": ["CPT"], "cape town": ["CPT"],
  "йоханнесбург": ["JNB"], "johannesburg": ["JNB"],
  "марракеш": ["RAK"], "marrakech": ["RAK"],
  "агадир": ["AGA"], "agadir": ["AGA"],

  // Дополнительные города: Азия и Океания
  "осака": ["KIX", "ITM"], "osaka": ["KIX", "ITM"],
  "нагоя": ["NGO"], "nagoya": ["NGO"],
  "фукуока": ["FUK"], "fukuoka": ["FUK"],
  "тайбэй": ["TPE", "TSA"], "taipei": ["TPE", "TSA"],
  "кларк": ["CRK"], "clark": ["CRK"],
  "манила": ["MNL"], "manila": ["MNL"],
  "себу": ["CEB"], "cebu": ["CEB"],
  "джакарта": ["CGK", "HLP"], "jakarta": ["CGK", "HLP"],
  "бали": ["DPS"], "bali": ["DPS"], "денпасар": ["DPS"], "denpasar": ["DPS"],
  "куала-лумпур": ["KUL"], "kuala lumpur": ["KUL"],
  "сингапур": ["SIN"], "singapore": ["SIN"],
  "хайдарабад": ["HYD"], "hyderabad": ["HYD"],
  "бангалор": ["BLR"], "bengaluru": ["BLR"], "bangalore": ["BLR"],
  "чennai": ["MAA"], "chennai": ["MAA"],
  "коломбо": ["CMB"], "colombo": ["CMB"],
  "катманду": ["KTM"], "kathmandu": ["KTM"],
  "исламабад": ["ISB"], "islamabad": ["ISB"],
  "лахор": ["LHE"], "lahore": ["LHE"],
  "карачи": ["KHI"], "karachi": ["KHI"],
  "перт": ["PER"], "perth": ["PER"],
  "мельбурн": ["MEL"], "melbourne": ["MEL"],
  "сидней": ["SYD"], "sydney": ["SYD"],
  "брисбен": ["BNE"], "brisbane": ["BNE"],
  "окленд": ["AKL"], "auckland": ["AKL"],

  // Дополнительные города: Америка
  "нью-йорк": ["JFK", "EWR", "LGA"], "new york": ["JFK", "EWR", "LGA"],
  "лос-анджелес": ["LAX"], "los angeles": ["LAX"],
  "сан-франциско": ["SFO"], "san francisco": ["SFO"],
  "чикаго": ["ORD", "MDW"], "chicago": ["ORD", "MDW"],
  "майами": ["MIA"], "miami": ["MIA"],
  "бостон": ["BOS"], "boston": ["BOS"],
  "вашингтон": ["IAD", "DCA"], "washington": ["IAD", "DCA"],
  "атланта": ["ATL"], "atlanta": ["ATL"],
  "даллас": ["DFW", "DAL"], "dallas": ["DFW", "DAL"],
  "хьюстон": ["IAH", "HOU"], "houston": ["IAH", "HOU"],
  "торонто": ["YYZ", "YTZ"], "toronto": ["YYZ", "YTZ"],
  "монреаль": ["YUL"], "montreal": ["YUL"],
  "ванкувер": ["YVR"], "vancouver": ["YVR"],
  "мехико": ["MEX"], "mexico city": ["MEX"],
  "канкун": ["CUN"], "cancun": ["CUN"],
  "сан-паулу": ["GRU", "CGH"], "sao paulo": ["GRU", "CGH"],
  "рио-де-жанейро": ["GIG", "SDU"], "rio de janeiro": ["GIG", "SDU"],
  "буэнос-айрес": ["EZE", "AEP"], "buenos aires": ["EZE", "AEP"]
};

function normalizeCity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

function firstAvailable(...values) {
  return values.find(value => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "object") {
      // API variants may wrap a gate/counter in an object.
      return Object.keys(value).length > 0;
    }
    return true;
  }) ?? null;
}

function displayValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const items = value.map(displayValue).filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  if (typeof value === "object") {
    // Avoid rendering JavaScript's unhelpful "[object Object]" in the UI.
    for (const key of ["name", "number", "code", "value", "iata", "label", "counter", "gate"]) {
      const candidate = displayValue(value[key]);
      if (candidate) return candidate;
    }
    return null;
  }
  return String(value);
}

function formatFlight(flight) {
  const departure = flight?.departure || {};
  const boarding = flight?.boarding || {};
  const checkInRaw = firstAvailable(
    departure.check_in_counter,
    departure.checkin_counter,
    departure.check_in,
    departure.checkin,
    departure.check_in_desks,
    departure.checkin_desks,
    departure.check_in_desk,
    departure.checkin_desk,
    departure.counter,
    departure.counters,
    departure.check_in_terminal,
    flight?.check_in_counter,
    flight?.checkin_counter,
    flight?.check_in,
    flight?.checkin
  );
  const gateRaw = firstAvailable(
    departure.gate,
    departure.gate_number,
    departure.boarding_gate,
    departure.gateName,
    boarding.gate,
    boarding.gate_number,
    flight?.gate,
    flight?.boarding_gate
  );

  return {
    flightNumber: displayValue(firstAvailable(flight?.flight?.iata, flight?.flight?.icao)),
    airline: displayValue(firstAvailable(flight?.airline?.name, flight?.airline?.iata)),
    departureAirport: displayValue(firstAvailable(departure.airport, departure.iata)),
    arrivalAirport: displayValue(firstAvailable(flight?.arrival?.airport, flight?.arrival?.iata)),
    aircraft: displayValue(firstAvailable(flight?.aircraft?.iata, flight?.aircraft?.icao, flight?.aircraft?.registration, flight?.aircraft)),
    departureTime: firstAvailable(departure.scheduled, departure.estimated, departure.actual),
    arrivalTime: firstAvailable(flight?.arrival?.scheduled, flight?.arrival?.estimated, flight?.arrival?.actual),
    checkIn: displayValue(checkInRaw),
    gate: displayValue(gateRaw),
    status: displayValue(flight?.flight_status)
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
    const flightNumber = String(req.query.flight || "").normalize("NFKC").trim().toUpperCase();
    const rawDepartureAirport = String(req.query.from || "").trim();
    const departureAirport = rawDepartureAirport.toUpperCase();

    // Do not silently fall back to Pulkovo: the selected airport must come from the page.
    if (!rawDepartureAirport) {
      console.warn("Flight search rejected: missing departure airport", {
        flightNumber,
        city: cityInput
      });
      return res.status(400).json({
        flight: null,
        source: "Aviationstack",
        error: "Selected departure airport was not provided. Please reselect the airport and try again."
      });
    }

    if (!/^[A-Z]{3}$/.test(departureAirport)) {
      return res.status(400).json({
        flight: null,
        source: "Aviationstack",
        error: "Departure airport must be a valid 3-letter IATA code."
      });
    }

    if (!/^.{1,7}$/u.test(flightNumber)) {
      return res.status(400).json({
        flight: null,
        source: "Aviationstack",
        error: "Flight code must contain 1 to 7 characters."
      });
    }

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

    console.log("Flight search request", {
      flightNumber,
      departureAirport,
      city: cityInput,
      destinationAirports
    });

    const results = [];

    // Departure airport comes from the airport selected above the flight board.
    // Make a separate request for each airport mapped to the destination city.
    for (const arrIata of destinationAirports) {
      const url = new URL("https://api.aviationstack.com/v1/flights");

      url.searchParams.set("access_key", apiKey);
      url.searchParams.set("dep_iata", departureAirport);
      url.searchParams.set("arr_iata", arrIata);
      url.searchParams.set("flight_iata", flightNumber);
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
        const exactMatches = data.data.filter(item => {
          const returnedNumber = String(item?.flight?.iata || "").normalize("NFKC").trim().toUpperCase();
          return returnedNumber === flightNumber &&
            String(item?.departure?.iata || "").toUpperCase() === departureAirport &&
            String(item?.arrival?.iata || "").toUpperCase() === arrIata;
        });
        results.push(...exactMatches);
      }
    }

    if (results.length === 0) {
      return res.json({
        flight: null,
        source: "Aviationstack",
        searchedCity: cityInput,
        from: departureAirport,
        destinationAirports,
        totalFlightsReceived: 0,
        searchedFlightNumber: flightNumber,
        note: `No flight ${flightNumber} found from ${departureAirport} to the selected destination.`
      });
    }

    // Diagnose missing airport operations data from the provider response.
    // Do not log credentials or the full API payload.
    const flight = results[0];
    const formattedFlight = formatFlight(flight);
    if (!formattedFlight.checkIn || !formattedFlight.gate) {
      console.warn("Flight operations fields missing from Aviationstack response", {
        flightNumber: formattedFlight.flightNumber,
        departureAirport: flight?.departure?.iata || departureAirport,
        arrivalAirport: flight?.arrival?.iata || null,
        departureKeys: Object.keys(flight?.departure || {}),
        checkInPresent: Boolean(formattedFlight.checkIn),
        gatePresent: Boolean(formattedFlight.gate)
      });
    }

    return res.json({
      flight: formattedFlight,
      source: "Aviationstack",
      searchedCity: cityInput,
      searchedFlightNumber: flightNumber,
      from: departureAirport,
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
