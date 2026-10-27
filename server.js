
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
  "буэнос-айрес": ["EZE", "AEP"], "buenos aires": ["EZE", "AEP"],
  // Expanded global city aliases (Russian and English)
  'нижневартовск': ['NJC'],
  'nizhnevartovsk': ['NJC'],
  'анапа': ['AAQ'],
  'anapa': ['AAQ'],
  'брянск': ['BZK'],
  'bryansk': ['BZK'],
  'барнаул': ['BAX'],
  'barnaul': ['BAX'],
  'благовещенск': ['BQS'],
  'blagoveshchensk': ['BQS'],
  'братск': ['BTK'],
  'bratsk': ['BTK'],
  'чита': ['HTA'],
  'chita': ['HTA'],
  'магадан': ['GDX'],
  'magadan': ['GDX'],
  'петропавловск-камчатский': ['PKC'],
  'petropavlovsk-kamchatsky': ['PKC'],
  'южно-сахалинск': ['UUS'],
  'yuzhno-sakhalinsk': ['UUS'],
  'норильск': ['NSK'],
  'norilsk': ['NSK'],
  'абакан': ['ABA'],
  'abakan': ['ABA'],
  'кызыл': ['KYZ'],
  'kyzyl': ['KYZ'],
  'оренбург': ['REN'],
  'orenburg': ['REN'],
  'саратов': ['GSV'],
  'saratov': ['GSV'],
  'пенза': ['PEZ'],
  'penza': ['PEZ'],
  'киров': ['KVX'],
  'kirov': ['KVX'],
  'курск': ['URS'],
  'kursk': ['URS'],
  'липецк': ['LPK'],
  'lipetsk': ['LPK'],
  'белгород': ['EGO'],
  'belgorod': ['EGO'],
  'иваново': ['IWA'],
  'ivanovo': ['IWA'],
  'псков': ['PKV'],
  'pskov': ['PKV'],
  'вологда': ['VGD'],
  'vologda': ['VGD'],
  'сыктывкар': ['SCW'],
  'syktyvkar': ['SCW'],
  'якутск': ['YKS'],
  'yakutsk': ['YKS'],
  'барселона': ['BCN'],
  'barcelona': ['BCN'],
  'рим': ['FCO'],
  'rome': ['FCO'],
  'милан': ['MXP', 'LIN'],
  'milan': ['MXP', 'LIN'],
  'лондон': ['LHR', 'LGW', 'STN', 'LTN'],
  'london': ['LHR', 'LGW', 'STN', 'LTN'],
  'париж': ['CDG', 'ORY'],
  'paris': ['CDG', 'ORY'],
  'амстердам': ['AMS'],
  'amsterdam': ['AMS'],
  'цюріх': ['ZRH'],
  'zurich': ['ZRH'],
  'вена': ['VIE'],
  'vienna': ['VIE'],
  'варшава': ['WAW'],
  'warsaw': ['WAW'],
  'прага': ['PRG'],
  'prague': ['PRG'],
  'будапешт': ['BUD'],
  'budapest': ['BUD'],
  'копенгаген': ['CPH'],
  'copenhagen': ['CPH'],
  'стокгольм': ['ARN'],
  'stockholm': ['ARN'],
  'осло': ['OSL'],
  'oslo': ['OSL'],
  'хельсинки': ['HEL'],
  'helsinki': ['HEL'],
  'брюссель': ['BRU'],
  'brussels': ['BRU'],
  'женeва': ['GVA'],
  'geneva': ['GVA'],
  'манчестер': ['MAN'],
  'manchester': ['MAN'],
  'дублин': ['DUB'],
  'dublin': ['DUB'],
  'белград': ['BEG'],
  'belgrade': ['BEG'],
  'ниш': ['INI'],
  'nis': ['INI'],
  'сараево': ['SJJ'],
  'sarajevo': ['SJJ'],
  'подгорица': ['TGD'],
  'podgorica': ['TGD'],
  'тирана': ['TIA'],
  'tirana': ['TIA'],
  'бухарест': ['OTP'],
  'bucharest': ['OTP'],
  'кипр': ['LCA', 'PFO'],
  'лarnaca': ['LCA'],
  'larnaca': ['LCA'],
  'анкара': ['ESB'],
  'ankara': ['ESB'],
  'анталья': ['AYT'],
  'antalya': ['AYT'],
  'измир': ['ADB'],
  'izmir': ['ADB'],
  'абу-даби': ['AUH'],
  'abu dhabi': ['AUH'],
  'шарджа': ['SHJ'],
  'sharjah': ['SHJ'],
  'эр-ривяд': ['RUH'],
  'riyadh': ['RUH'],
  'джидда': ['JED'],
  'jeddah': ['JED'],
  'маскат': ['MCT'],
  'muscat': ['MCT'],
  'кувейт': ['KWI'],
  'kuwait': ['KWI'],
  'манама': ['BAH'],
  'manama': ['BAH'],
  'пекин': ['PEK', 'PKX'],
  'beijing': ['PEK', 'PKX'],
  'токио': ['HND', 'NRT'],
  'tokyo': ['HND', 'NRT'],
  'сеул': ['ICN', 'GMP'],
  'seoul': ['ICN', 'GMP'],
  'хошимин': ['SGN'],
  'ho chi minh city': ['SGN'],
  'ханой': ['HAN'],
  'hanoi': ['HAN'],
  'дакка': ['DAC'],
  'dhaka': ['DAC'],
  'ла-гор': ['LOS'],
  'lagos': ['LOS'],
  'аккра': ['ACC'],
  'accra': ['ACC'],
  'алжир': ['ALG'],
  'algiers': ['ALG'],
  'тунис': ['TUN'],
  'tunis': ['TUN'],
  'панама-сити': ['PTY'],
  'panama city': ['PTY'],
  'богота': ['BOG'],
  'bogota': ['BOG'],
  'лима': ['LIM'],
  'lima': ['LIM'],
  'сантьяго': ['SCL'],
  'santiago': ['SCL'],
  'лас-вегас': ['LAS'],
  'las vegas': ['LAS'],
  'сиэтл': ['SEA'],
  'seattle': ['SEA'],
  'денвер': ['DEN'],
  'denver': ['DEN'],
  'финикс': ['PHX'],
  'phoenix': ['PHX'],
  'калгари': ['YYC'],
  'calgary': ['YYC'],
  'оттава': ['YOW'],
  'ottawa': ['YOW'],
  'маврикий': ['MRU'],
  'mauritius': ['MRU'],
};

function normalizeCity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

function formatFlight(flight) {
  const checkInCounter = [
    flight?.departure?.check_in_counter,
    flight?.departure?.checkin_counter,
    flight?.departure?.check_in,
    flight?.departure?.checkin,
    flight?.departure?.check_in_desks,
    flight?.departure?.checkin_desks,
    flight?.departure?.check_in_desk,
    flight?.departure?.checkin_desk,
    flight?.departure?.check_in_counter_number,
    flight?.departure?.checkin_counter_number,
    flight?.departure?.check_in_zone,
    flight?.departure?.checkin_zone,
    flight?.departure?.counter,
    flight?.departure?.counters
  ].find(value => value !== undefined && value !== null && String(value).trim() !== "") ?? null;

  const gate = [
    flight?.departure?.gate,
    flight?.departure?.gate_number,
    flight?.departure?.boarding_gate,
    flight?.departure?.gateName,
    flight?.gate,
    flight?.boarding?.gate
  ].find(value => value !== undefined && value !== null && String(value).trim() !== "") ?? null;

  return {
    flightNumber: flight?.flight?.iata || flight?.flight?.icao || null,
    airline: flight?.airline?.name || flight?.airline?.iata || null,
    departureAirport: flight?.departure?.airport || flight?.departure?.iata || null,
    arrivalAirport: flight?.arrival?.airport || flight?.arrival?.iata || null,
    aircraft: flight?.aircraft?.iata || flight?.aircraft?.icao || flight?.aircraft?.registration || null,
    departureTime: flight?.departure?.scheduled || flight?.departure?.estimated || flight?.departure?.actual || null,
    arrivalTime: flight?.arrival?.scheduled || flight?.arrival?.estimated || flight?.arrival?.actual || null,
    // Keep both the flat and legacy nested response shapes for compatibility.
    departure: {
      airport: flight?.departure?.airport || null,
      iata: flight?.departure?.iata || null,
      scheduled: flight?.departure?.scheduled || null,
      estimated: flight?.departure?.estimated || null,
      actual: flight?.departure?.actual || null,
      checkInCounter,
      gate
    },
    // Preserve both fields independently. Providers can use different names
    // for check-in desks and boarding gates; empty strings should not block fallbacks.
    checkIn: checkInCounter,
    gate,
    status: flight?.flight_status || null
  };
}



// Cached airport reference data and country information endpoints.
let airportsCsvCache = { at: 0, rows: null };
const countryInfoCache = new Map();
const COUNTRY_INFO_TTL = 30 * 60 * 1000;

function parseCsvLine(line) {
  const out = []; let value = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { out.push(value); value = ''; }
    else value += ch;
  }
  out.push(value); return out;
}

async function getAirportReferenceRows() {
  if (airportsCsvCache.rows && Date.now() - airportsCsvCache.at < 24 * 60 * 60 * 1000) return airportsCsvCache.rows;
  const response = await fetch('https://ourairports.com/data/airports.csv');
  if (!response.ok) throw new Error(`Airport reference data HTTP ${response.status}`);
  const csv = await response.text();
  const lines = csv.split(/\r?\n/);
  if (!lines.length) throw new Error('Airport reference data is empty');
  const headers = parseCsvLine(lines[0]);
  const index = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cols = parseCsvLine(lines[i]);
    const iata = String(cols[index.iata_code] || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(iata) || rows.has(iata)) continue;
    const lat = Number(cols[index.latitude_deg]); const lon = Number(cols[index.longitude_deg]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    rows.set(iata, {
      code: iata, name: cols[index.name] || iata,
      city: cols[index.municipality] || '', countryCode: cols[index.iso_country] || '',
      latitude: lat, longitude: lon
    });
  }
  airportsCsvCache = { at: Date.now(), rows };
  return rows;
}

async function getCountryInfoForAirport(airportCode, city) {
  const cacheKey = `${airportCode}|${city}`.toUpperCase();
  const cached = countryInfoCache.get(cacheKey);
  if (cached && Date.now() - cached.at < COUNTRY_INFO_TTL) return cached.data;

  let airport = null;
  try { airport = (await getAirportReferenceRows()).get(airportCode) || null; }
  catch (err) { console.warn('Airport CSV lookup unavailable; trying city geocoding:', err.message); }

  if (!airport || !airport.countryCode) {
    const query = `${city} airport`;
    const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geoUrl.searchParams.set('name', query);
    geoUrl.searchParams.set('count', '10');
    geoUrl.searchParams.set('language', 'en');
    geoUrl.searchParams.set('format', 'json');
    let geo = await fetch(geoUrl);
    let geoData = geo.ok ? await geo.json() : {};
    let result = (geoData.results || []).find(x => x.feature_code === 'AIRP') || (geoData.results || [])[0];
    if (!result) {
      geoUrl.searchParams.set('name', city);
      geo = await fetch(geoUrl); geoData = geo.ok ? await geo.json() : {};
      result = (geoData.results || [])[0];
    }
    if (!result) throw new Error('Could not locate the selected airport or city.');
    airport = { code: airportCode, name: `${city} Airport`, city, countryCode: result.country_code, latitude: result.latitude, longitude: result.longitude };
  }

  const countryResponse = await fetch(`https://countries.dev/alpha/${encodeURIComponent(airport.countryCode)}`);
  if (!countryResponse.ok) throw new Error(`Country lookup HTTP ${countryResponse.status}`);
  const rawCountry = await countryResponse.json();
  const country = Array.isArray(rawCountry) ? (rawCountry[0] || {}) : rawCountry;
  const countryName = typeof country.name === 'string' ? country.name : (country.name?.common || country.name?.official || country.commonName || airport.countryCode);
  // countries.dev currently returns currencies as [{code,name,symbol}],
  // but accept object-shaped payloads too for resilience across data providers.
  let currencyCode = null;
  if (Array.isArray(country.currencies)) {
    const firstCurrency = country.currencies.find(c => c && (c.code || c.currencyCode || c.iso_code));
    currencyCode = firstCurrency?.code || firstCurrency?.currencyCode || firstCurrency?.iso_code || null;
  } else if (country.currencies && typeof country.currencies === 'object') {
    const entries = Object.entries(country.currencies);
    const firstCurrency = entries.find(([, c]) => c && typeof c === 'object');
    currencyCode = firstCurrency?.[1]?.code || firstCurrency?.[1]?.currencyCode || firstCurrency?.[1]?.iso_code || firstCurrency?.[0] || entries[0]?.[0] || null;
  }
  currencyCode = String(currencyCode || '').trim().toUpperCase() || null;
  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', String(airport.latitude));
  weatherUrl.searchParams.set('longitude', String(airport.longitude));
  weatherUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,weather_code');
  weatherUrl.searchParams.set('timezone', 'auto');
  const weatherPromise = fetch(weatherUrl).then(async r => { if (!r.ok) throw new Error(`Weather HTTP ${r.status}`); return r.json(); });
  const currencyPromise = (async () => {
    if (!currencyCode) return { code: null, rate: null, base: null, date: null, supported: false };
    // Try base currencies in the exact requested order. GBP is the correct ISO code (not GPB).
    const bases = ['USD', 'EUR', 'GBP', 'CHF', 'CNY'];
    for (const base of bases) {
      if (base === currencyCode) {
        return { code: currencyCode, rate: 1, base, date: null, supported: true };
      }
      try {
        const r = await fetch(`https://api.frankfurter.dev/v2/rate/${base}/${encodeURIComponent(currencyCode)}`);
        if (!r.ok) {
          console.warn(`Frankfurter pair ${base}/${currencyCode} unavailable (HTTP ${r.status}); trying next base.`);
          continue;
        }
        const data = await r.json();
        const rate = Number(data.rate);
        if (!Number.isFinite(rate) || rate <= 0) {
          console.warn(`Frankfurter returned an invalid rate for ${base}/${currencyCode}; trying next base.`);
          continue;
        }
        return { code: currencyCode, rate, base, date: data.date || null, supported: true };
      } catch (err) {
        console.warn(`Currency lookup ${base}/${currencyCode} failed:`, err.message);
      }
    }
    return { code: currencyCode, rate: null, base: null, date: null, supported: false };
  })();
  const [weatherData, currencyData] = await Promise.all([weatherPromise, currencyPromise]);
  const data = {
    airport: { code: airportCode, name: airport.name, city: airport.city || city, latitude: airport.latitude, longitude: airport.longitude },
    country: { name: countryName, alpha2Code: country.alpha2Code || country.cca2 || airport.countryCode, alpha3Code: country.alpha3Code || country.cca3 || null, flag: country.flag || country.flags?.svg || country.flags?.png || null },
    currency: currencyData,
    weather: weatherData.current || null,
    weatherTimezone: weatherData.timezone || null,
    weatherTime: weatherData.current?.time || null,
    sources: ['OurAirports', 'countries.dev', 'Open-Meteo', 'Frankfurter']
  };
  countryInfoCache.set(cacheKey, { at: Date.now(), data });
  return data;
}

const STATIC_COUNTRY_FALLBACK = [{"name":"Afghanistan","alpha2Code":"AF","alpha3Code":"AFG","flag":"🇦🇫"},{"name":"Albania","alpha2Code":"AL","alpha3Code":"ALB","flag":"🇦🇱"},{"name":"Algeria","alpha2Code":"DZ","alpha3Code":"DZA","flag":"🇩🇿"},{"name":"American Samoa","alpha2Code":"AS","alpha3Code":"ASM","flag":"🇦🇸"},{"name":"Andorra","alpha2Code":"AD","alpha3Code":"AND","flag":"🇦🇩"},{"name":"Angola","alpha2Code":"AO","alpha3Code":"AGO","flag":"🇦🇴"},{"name":"Anguilla","alpha2Code":"AI","alpha3Code":"AIA","flag":"🇦🇮"},{"name":"Antarctica","alpha2Code":"AQ","alpha3Code":"ATA","flag":"🇦🇶"},{"name":"Antigua and Barbuda","alpha2Code":"AG","alpha3Code":"ATG","flag":"🇦🇬"},{"name":"Argentina","alpha2Code":"AR","alpha3Code":"ARG","flag":"🇦🇷"},{"name":"Armenia","alpha2Code":"AM","alpha3Code":"ARM","flag":"🇦🇲"},{"name":"Aruba","alpha2Code":"AW","alpha3Code":"ABW","flag":"🇦🇼"},{"name":"Australia","alpha2Code":"AU","alpha3Code":"AUS","flag":"🇦🇺"},{"name":"Austria","alpha2Code":"AT","alpha3Code":"AUT","flag":"🇦🇹"},{"name":"Azerbaijan","alpha2Code":"AZ","alpha3Code":"AZE","flag":"🇦🇿"},{"name":"Bahamas","alpha2Code":"BS","alpha3Code":"BHS","flag":"🇧🇸"},{"name":"Bahrain","alpha2Code":"BH","alpha3Code":"BHR","flag":"🇧🇭"},{"name":"Bangladesh","alpha2Code":"BD","alpha3Code":"BGD","flag":"🇧🇩"},{"name":"Barbados","alpha2Code":"BB","alpha3Code":"BRB","flag":"🇧🇧"},{"name":"Belarus","alpha2Code":"BY","alpha3Code":"BLR","flag":"🇧🇾"},{"name":"Belgium","alpha2Code":"BE","alpha3Code":"BEL","flag":"🇧🇪"},{"name":"Belize","alpha2Code":"BZ","alpha3Code":"BLZ","flag":"🇧🇿"},{"name":"Benin","alpha2Code":"BJ","alpha3Code":"BEN","flag":"🇧🇯"},{"name":"Bermuda","alpha2Code":"BM","alpha3Code":"BMU","flag":"🇧🇲"},{"name":"Bhutan","alpha2Code":"BT","alpha3Code":"BTN","flag":"🇧🇹"},{"name":"Bolivia, Plurinational State of","alpha2Code":"BO","alpha3Code":"BOL","flag":"🇧🇴"},{"name":"Bonaire, Sint Eustatius and Saba","alpha2Code":"BQ","alpha3Code":"BES","flag":"🇧🇶"},{"name":"Bosnia and Herzegovina","alpha2Code":"BA","alpha3Code":"BIH","flag":"🇧🇦"},{"name":"Botswana","alpha2Code":"BW","alpha3Code":"BWA","flag":"🇧🇼"},{"name":"Bouvet Island","alpha2Code":"BV","alpha3Code":"BVT","flag":"🇧🇻"},{"name":"Brazil","alpha2Code":"BR","alpha3Code":"BRA","flag":"🇧🇷"},{"name":"British Indian Ocean Territory","alpha2Code":"IO","alpha3Code":"IOT","flag":"🇮🇴"},{"name":"Brunei Darussalam","alpha2Code":"BN","alpha3Code":"BRN","flag":"🇧🇳"},{"name":"Bulgaria","alpha2Code":"BG","alpha3Code":"BGR","flag":"🇧🇬"},{"name":"Burkina Faso","alpha2Code":"BF","alpha3Code":"BFA","flag":"🇧🇫"},{"name":"Burundi","alpha2Code":"BI","alpha3Code":"BDI","flag":"🇧🇮"},{"name":"Cabo Verde","alpha2Code":"CV","alpha3Code":"CPV","flag":"🇨🇻"},{"name":"Cambodia","alpha2Code":"KH","alpha3Code":"KHM","flag":"🇰🇭"},{"name":"Cameroon","alpha2Code":"CM","alpha3Code":"CMR","flag":"🇨🇲"},{"name":"Canada","alpha2Code":"CA","alpha3Code":"CAN","flag":"🇨🇦"},{"name":"Cayman Islands","alpha2Code":"KY","alpha3Code":"CYM","flag":"🇰🇾"},{"name":"Central African Republic","alpha2Code":"CF","alpha3Code":"CAF","flag":"🇨🇫"},{"name":"Chad","alpha2Code":"TD","alpha3Code":"TCD","flag":"🇹🇩"},{"name":"Chile","alpha2Code":"CL","alpha3Code":"CHL","flag":"🇨🇱"},{"name":"China","alpha2Code":"CN","alpha3Code":"CHN","flag":"🇨🇳"},{"name":"Christmas Island","alpha2Code":"CX","alpha3Code":"CXR","flag":"🇨🇽"},{"name":"Cocos (Keeling) Islands","alpha2Code":"CC","alpha3Code":"CCK","flag":"🇨🇨"},{"name":"Colombia","alpha2Code":"CO","alpha3Code":"COL","flag":"🇨🇴"},{"name":"Comoros","alpha2Code":"KM","alpha3Code":"COM","flag":"🇰🇲"},{"name":"Congo","alpha2Code":"CG","alpha3Code":"COG","flag":"🇨🇬"},{"name":"Congo, The Democratic Republic of the","alpha2Code":"CD","alpha3Code":"COD","flag":"🇨🇩"},{"name":"Cook Islands","alpha2Code":"CK","alpha3Code":"COK","flag":"🇨🇰"},{"name":"Costa Rica","alpha2Code":"CR","alpha3Code":"CRI","flag":"🇨🇷"},{"name":"Croatia","alpha2Code":"HR","alpha3Code":"HRV","flag":"🇭🇷"},{"name":"Cuba","alpha2Code":"CU","alpha3Code":"CUB","flag":"🇨🇺"},{"name":"Curaçao","alpha2Code":"CW","alpha3Code":"CUW","flag":"🇨🇼"},{"name":"Cyprus","alpha2Code":"CY","alpha3Code":"CYP","flag":"🇨🇾"},{"name":"Czechia","alpha2Code":"CZ","alpha3Code":"CZE","flag":"🇨🇿"},{"name":"Côte d'Ivoire","alpha2Code":"CI","alpha3Code":"CIV","flag":"🇨🇮"},{"name":"Denmark","alpha2Code":"DK","alpha3Code":"DNK","flag":"🇩🇰"},{"name":"Djibouti","alpha2Code":"DJ","alpha3Code":"DJI","flag":"🇩🇯"},{"name":"Dominica","alpha2Code":"DM","alpha3Code":"DMA","flag":"🇩🇲"},{"name":"Dominican Republic","alpha2Code":"DO","alpha3Code":"DOM","flag":"🇩🇴"},{"name":"Ecuador","alpha2Code":"EC","alpha3Code":"ECU","flag":"🇪🇨"},{"name":"Egypt","alpha2Code":"EG","alpha3Code":"EGY","flag":"🇪🇬"},{"name":"El Salvador","alpha2Code":"SV","alpha3Code":"SLV","flag":"🇸🇻"},{"name":"Equatorial Guinea","alpha2Code":"GQ","alpha3Code":"GNQ","flag":"🇬🇶"},{"name":"Eritrea","alpha2Code":"ER","alpha3Code":"ERI","flag":"🇪🇷"},{"name":"Estonia","alpha2Code":"EE","alpha3Code":"EST","flag":"🇪🇪"},{"name":"Eswatini","alpha2Code":"SZ","alpha3Code":"SWZ","flag":"🇸🇿"},{"name":"Ethiopia","alpha2Code":"ET","alpha3Code":"ETH","flag":"🇪🇹"},{"name":"Falkland Islands (Malvinas)","alpha2Code":"FK","alpha3Code":"FLK","flag":"🇫🇰"},{"name":"Faroe Islands","alpha2Code":"FO","alpha3Code":"FRO","flag":"🇫🇴"},{"name":"Fiji","alpha2Code":"FJ","alpha3Code":"FJI","flag":"🇫🇯"},{"name":"Finland","alpha2Code":"FI","alpha3Code":"FIN","flag":"🇫🇮"},{"name":"France","alpha2Code":"FR","alpha3Code":"FRA","flag":"🇫🇷"},{"name":"French Guiana","alpha2Code":"GF","alpha3Code":"GUF","flag":"🇬🇫"},{"name":"French Polynesia","alpha2Code":"PF","alpha3Code":"PYF","flag":"🇵🇫"},{"name":"French Southern Territories","alpha2Code":"TF","alpha3Code":"ATF","flag":"🇹🇫"},{"name":"Gabon","alpha2Code":"GA","alpha3Code":"GAB","flag":"🇬🇦"},{"name":"Gambia","alpha2Code":"GM","alpha3Code":"GMB","flag":"🇬🇲"},{"name":"Georgia","alpha2Code":"GE","alpha3Code":"GEO","flag":"🇬🇪"},{"name":"Germany","alpha2Code":"DE","alpha3Code":"DEU","flag":"🇩🇪"},{"name":"Ghana","alpha2Code":"GH","alpha3Code":"GHA","flag":"🇬🇭"},{"name":"Gibraltar","alpha2Code":"GI","alpha3Code":"GIB","flag":"🇬🇮"},{"name":"Greece","alpha2Code":"GR","alpha3Code":"GRC","flag":"🇬🇷"},{"name":"Greenland","alpha2Code":"GL","alpha3Code":"GRL","flag":"🇬🇱"},{"name":"Grenada","alpha2Code":"GD","alpha3Code":"GRD","flag":"🇬🇩"},{"name":"Guadeloupe","alpha2Code":"GP","alpha3Code":"GLP","flag":"🇬🇵"},{"name":"Guam","alpha2Code":"GU","alpha3Code":"GUM","flag":"🇬🇺"},{"name":"Guatemala","alpha2Code":"GT","alpha3Code":"GTM","flag":"🇬🇹"},{"name":"Guernsey","alpha2Code":"GG","alpha3Code":"GGY","flag":"🇬🇬"},{"name":"Guinea","alpha2Code":"GN","alpha3Code":"GIN","flag":"🇬🇳"},{"name":"Guinea-Bissau","alpha2Code":"GW","alpha3Code":"GNB","flag":"🇬🇼"},{"name":"Guyana","alpha2Code":"GY","alpha3Code":"GUY","flag":"🇬🇾"},{"name":"Haiti","alpha2Code":"HT","alpha3Code":"HTI","flag":"🇭🇹"},{"name":"Heard Island and McDonald Islands","alpha2Code":"HM","alpha3Code":"HMD","flag":"🇭🇲"},{"name":"Holy See (Vatican City State)","alpha2Code":"VA","alpha3Code":"VAT","flag":"🇻🇦"},{"name":"Honduras","alpha2Code":"HN","alpha3Code":"HND","flag":"🇭🇳"},{"name":"Hong Kong","alpha2Code":"HK","alpha3Code":"HKG","flag":"🇭🇰"},{"name":"Hungary","alpha2Code":"HU","alpha3Code":"HUN","flag":"🇭🇺"},{"name":"Iceland","alpha2Code":"IS","alpha3Code":"ISL","flag":"🇮🇸"},{"name":"India","alpha2Code":"IN","alpha3Code":"IND","flag":"🇮🇳"},{"name":"Indonesia","alpha2Code":"ID","alpha3Code":"IDN","flag":"🇮🇩"},{"name":"Iran, Islamic Republic of","alpha2Code":"IR","alpha3Code":"IRN","flag":"🇮🇷"},{"name":"Iraq","alpha2Code":"IQ","alpha3Code":"IRQ","flag":"🇮🇶"},{"name":"Ireland","alpha2Code":"IE","alpha3Code":"IRL","flag":"🇮🇪"},{"name":"Isle of Man","alpha2Code":"IM","alpha3Code":"IMN","flag":"🇮🇲"},{"name":"Israel","alpha2Code":"IL","alpha3Code":"ISR","flag":"🇮🇱"},{"name":"Italy","alpha2Code":"IT","alpha3Code":"ITA","flag":"🇮🇹"},{"name":"Jamaica","alpha2Code":"JM","alpha3Code":"JAM","flag":"🇯🇲"},{"name":"Japan","alpha2Code":"JP","alpha3Code":"JPN","flag":"🇯🇵"},{"name":"Jersey","alpha2Code":"JE","alpha3Code":"JEY","flag":"🇯🇪"},{"name":"Jordan","alpha2Code":"JO","alpha3Code":"JOR","flag":"🇯🇴"},{"name":"Kazakhstan","alpha2Code":"KZ","alpha3Code":"KAZ","flag":"🇰🇿"},{"name":"Kenya","alpha2Code":"KE","alpha3Code":"KEN","flag":"🇰🇪"},{"name":"Kiribati","alpha2Code":"KI","alpha3Code":"KIR","flag":"🇰🇮"},{"name":"Korea, Democratic People's Republic of","alpha2Code":"KP","alpha3Code":"PRK","flag":"🇰🇵"},{"name":"Korea, Republic of","alpha2Code":"KR","alpha3Code":"KOR","flag":"🇰🇷"},{"name":"Kuwait","alpha2Code":"KW","alpha3Code":"KWT","flag":"🇰🇼"},{"name":"Kyrgyzstan","alpha2Code":"KG","alpha3Code":"KGZ","flag":"🇰🇬"},{"name":"Lao People's Democratic Republic","alpha2Code":"LA","alpha3Code":"LAO","flag":"🇱🇦"},{"name":"Latvia","alpha2Code":"LV","alpha3Code":"LVA","flag":"🇱🇻"},{"name":"Lebanon","alpha2Code":"LB","alpha3Code":"LBN","flag":"🇱🇧"},{"name":"Lesotho","alpha2Code":"LS","alpha3Code":"LSO","flag":"🇱🇸"},{"name":"Liberia","alpha2Code":"LR","alpha3Code":"LBR","flag":"🇱🇷"},{"name":"Libya","alpha2Code":"LY","alpha3Code":"LBY","flag":"🇱🇾"},{"name":"Liechtenstein","alpha2Code":"LI","alpha3Code":"LIE","flag":"🇱🇮"},{"name":"Lithuania","alpha2Code":"LT","alpha3Code":"LTU","flag":"🇱🇹"},{"name":"Luxembourg","alpha2Code":"LU","alpha3Code":"LUX","flag":"🇱🇺"},{"name":"Macao","alpha2Code":"MO","alpha3Code":"MAC","flag":"🇲🇴"},{"name":"Madagascar","alpha2Code":"MG","alpha3Code":"MDG","flag":"🇲🇬"},{"name":"Malawi","alpha2Code":"MW","alpha3Code":"MWI","flag":"🇲🇼"},{"name":"Malaysia","alpha2Code":"MY","alpha3Code":"MYS","flag":"🇲🇾"},{"name":"Maldives","alpha2Code":"MV","alpha3Code":"MDV","flag":"🇲🇻"},{"name":"Mali","alpha2Code":"ML","alpha3Code":"MLI","flag":"🇲🇱"},{"name":"Malta","alpha2Code":"MT","alpha3Code":"MLT","flag":"🇲🇹"},{"name":"Marshall Islands","alpha2Code":"MH","alpha3Code":"MHL","flag":"🇲🇭"},{"name":"Martinique","alpha2Code":"MQ","alpha3Code":"MTQ","flag":"🇲🇶"},{"name":"Mauritania","alpha2Code":"MR","alpha3Code":"MRT","flag":"🇲🇷"},{"name":"Mauritius","alpha2Code":"MU","alpha3Code":"MUS","flag":"🇲🇺"},{"name":"Mayotte","alpha2Code":"YT","alpha3Code":"MYT","flag":"🇾🇹"},{"name":"Mexico","alpha2Code":"MX","alpha3Code":"MEX","flag":"🇲🇽"},{"name":"Micronesia, Federated States of","alpha2Code":"FM","alpha3Code":"FSM","flag":"🇫🇲"},{"name":"Moldova, Republic of","alpha2Code":"MD","alpha3Code":"MDA","flag":"🇲🇩"},{"name":"Monaco","alpha2Code":"MC","alpha3Code":"MCO","flag":"🇲🇨"},{"name":"Mongolia","alpha2Code":"MN","alpha3Code":"MNG","flag":"🇲🇳"},{"name":"Montenegro","alpha2Code":"ME","alpha3Code":"MNE","flag":"🇲🇪"},{"name":"Montserrat","alpha2Code":"MS","alpha3Code":"MSR","flag":"🇲🇸"},{"name":"Morocco","alpha2Code":"MA","alpha3Code":"MAR","flag":"🇲🇦"},{"name":"Mozambique","alpha2Code":"MZ","alpha3Code":"MOZ","flag":"🇲🇿"},{"name":"Myanmar","alpha2Code":"MM","alpha3Code":"MMR","flag":"🇲🇲"},{"name":"Namibia","alpha2Code":"NA","alpha3Code":"NAM","flag":"🇳🇦"},{"name":"Nauru","alpha2Code":"NR","alpha3Code":"NRU","flag":"🇳🇷"},{"name":"Nepal","alpha2Code":"NP","alpha3Code":"NPL","flag":"🇳🇵"},{"name":"Netherlands","alpha2Code":"NL","alpha3Code":"NLD","flag":"🇳🇱"},{"name":"New Caledonia","alpha2Code":"NC","alpha3Code":"NCL","flag":"🇳🇨"},{"name":"New Zealand","alpha2Code":"NZ","alpha3Code":"NZL","flag":"🇳🇿"},{"name":"Nicaragua","alpha2Code":"NI","alpha3Code":"NIC","flag":"🇳🇮"},{"name":"Niger","alpha2Code":"NE","alpha3Code":"NER","flag":"🇳🇪"},{"name":"Nigeria","alpha2Code":"NG","alpha3Code":"NGA","flag":"🇳🇬"},{"name":"Niue","alpha2Code":"NU","alpha3Code":"NIU","flag":"🇳🇺"},{"name":"Norfolk Island","alpha2Code":"NF","alpha3Code":"NFK","flag":"🇳🇫"},{"name":"North Macedonia","alpha2Code":"MK","alpha3Code":"MKD","flag":"🇲🇰"},{"name":"Northern Mariana Islands","alpha2Code":"MP","alpha3Code":"MNP","flag":"🇲🇵"},{"name":"Norway","alpha2Code":"NO","alpha3Code":"NOR","flag":"🇳🇴"},{"name":"Oman","alpha2Code":"OM","alpha3Code":"OMN","flag":"🇴🇲"},{"name":"Pakistan","alpha2Code":"PK","alpha3Code":"PAK","flag":"🇵🇰"},{"name":"Palau","alpha2Code":"PW","alpha3Code":"PLW","flag":"🇵🇼"},{"name":"Palestine, State of","alpha2Code":"PS","alpha3Code":"PSE","flag":"🇵🇸"},{"name":"Panama","alpha2Code":"PA","alpha3Code":"PAN","flag":"🇵🇦"},{"name":"Papua New Guinea","alpha2Code":"PG","alpha3Code":"PNG","flag":"🇵🇬"},{"name":"Paraguay","alpha2Code":"PY","alpha3Code":"PRY","flag":"🇵🇾"},{"name":"Peru","alpha2Code":"PE","alpha3Code":"PER","flag":"🇵🇪"},{"name":"Philippines","alpha2Code":"PH","alpha3Code":"PHL","flag":"🇵🇭"},{"name":"Pitcairn","alpha2Code":"PN","alpha3Code":"PCN","flag":"🇵🇳"},{"name":"Poland","alpha2Code":"PL","alpha3Code":"POL","flag":"🇵🇱"},{"name":"Portugal","alpha2Code":"PT","alpha3Code":"PRT","flag":"🇵🇹"},{"name":"Puerto Rico","alpha2Code":"PR","alpha3Code":"PRI","flag":"🇵🇷"},{"name":"Qatar","alpha2Code":"QA","alpha3Code":"QAT","flag":"🇶🇦"},{"name":"Romania","alpha2Code":"RO","alpha3Code":"ROU","flag":"🇷🇴"},{"name":"Russian Federation","alpha2Code":"RU","alpha3Code":"RUS","flag":"🇷🇺"},{"name":"Rwanda","alpha2Code":"RW","alpha3Code":"RWA","flag":"🇷🇼"},{"name":"Réunion","alpha2Code":"RE","alpha3Code":"REU","flag":"🇷🇪"},{"name":"Saint Barthélemy","alpha2Code":"BL","alpha3Code":"BLM","flag":"🇧🇱"},{"name":"Saint Helena, Ascension and Tristan da Cunha","alpha2Code":"SH","alpha3Code":"SHN","flag":"🇸🇭"},{"name":"Saint Kitts and Nevis","alpha2Code":"KN","alpha3Code":"KNA","flag":"🇰🇳"},{"name":"Saint Lucia","alpha2Code":"LC","alpha3Code":"LCA","flag":"🇱🇨"},{"name":"Saint Martin (French part)","alpha2Code":"MF","alpha3Code":"MAF","flag":"🇲🇫"},{"name":"Saint Pierre and Miquelon","alpha2Code":"PM","alpha3Code":"SPM","flag":"🇵🇲"},{"name":"Saint Vincent and the Grenadines","alpha2Code":"VC","alpha3Code":"VCT","flag":"🇻🇨"},{"name":"Samoa","alpha2Code":"WS","alpha3Code":"WSM","flag":"🇼🇸"},{"name":"San Marino","alpha2Code":"SM","alpha3Code":"SMR","flag":"🇸🇲"},{"name":"Sao Tome and Principe","alpha2Code":"ST","alpha3Code":"STP","flag":"🇸🇹"},{"name":"Saudi Arabia","alpha2Code":"SA","alpha3Code":"SAU","flag":"🇸🇦"},{"name":"Senegal","alpha2Code":"SN","alpha3Code":"SEN","flag":"🇸🇳"},{"name":"Serbia","alpha2Code":"RS","alpha3Code":"SRB","flag":"🇷🇸"},{"name":"Seychelles","alpha2Code":"SC","alpha3Code":"SYC","flag":"🇸🇨"},{"name":"Sierra Leone","alpha2Code":"SL","alpha3Code":"SLE","flag":"🇸🇱"},{"name":"Singapore","alpha2Code":"SG","alpha3Code":"SGP","flag":"🇸🇬"},{"name":"Sint Maarten (Dutch part)","alpha2Code":"SX","alpha3Code":"SXM","flag":"🇸🇽"},{"name":"Slovakia","alpha2Code":"SK","alpha3Code":"SVK","flag":"🇸🇰"},{"name":"Slovenia","alpha2Code":"SI","alpha3Code":"SVN","flag":"🇸🇮"},{"name":"Solomon Islands","alpha2Code":"SB","alpha3Code":"SLB","flag":"🇸🇧"},{"name":"Somalia","alpha2Code":"SO","alpha3Code":"SOM","flag":"🇸🇴"},{"name":"South Africa","alpha2Code":"ZA","alpha3Code":"ZAF","flag":"🇿🇦"},{"name":"South Georgia and the South Sandwich Islands","alpha2Code":"GS","alpha3Code":"SGS","flag":"🇬🇸"},{"name":"South Sudan","alpha2Code":"SS","alpha3Code":"SSD","flag":"🇸🇸"},{"name":"Spain","alpha2Code":"ES","alpha3Code":"ESP","flag":"🇪🇸"},{"name":"Sri Lanka","alpha2Code":"LK","alpha3Code":"LKA","flag":"🇱🇰"},{"name":"Sudan","alpha2Code":"SD","alpha3Code":"SDN","flag":"🇸🇩"},{"name":"Suriname","alpha2Code":"SR","alpha3Code":"SUR","flag":"🇸🇷"},{"name":"Svalbard and Jan Mayen","alpha2Code":"SJ","alpha3Code":"SJM","flag":"🇸🇯"},{"name":"Sweden","alpha2Code":"SE","alpha3Code":"SWE","flag":"🇸🇪"},{"name":"Switzerland","alpha2Code":"CH","alpha3Code":"CHE","flag":"🇨🇭"},{"name":"Syrian Arab Republic","alpha2Code":"SY","alpha3Code":"SYR","flag":"🇸🇾"},{"name":"Taiwan, Province of China","alpha2Code":"TW","alpha3Code":"TWN","flag":"🇹🇼"},{"name":"Tajikistan","alpha2Code":"TJ","alpha3Code":"TJK","flag":"🇹🇯"},{"name":"Tanzania, United Republic of","alpha2Code":"TZ","alpha3Code":"TZA","flag":"🇹🇿"},{"name":"Thailand","alpha2Code":"TH","alpha3Code":"THA","flag":"🇹🇭"},{"name":"Timor-Leste","alpha2Code":"TL","alpha3Code":"TLS","flag":"🇹🇱"},{"name":"Togo","alpha2Code":"TG","alpha3Code":"TGO","flag":"🇹🇬"},{"name":"Tokelau","alpha2Code":"TK","alpha3Code":"TKL","flag":"🇹🇰"},{"name":"Tonga","alpha2Code":"TO","alpha3Code":"TON","flag":"🇹🇴"},{"name":"Trinidad and Tobago","alpha2Code":"TT","alpha3Code":"TTO","flag":"🇹🇹"},{"name":"Tunisia","alpha2Code":"TN","alpha3Code":"TUN","flag":"🇹🇳"},{"name":"Turkmenistan","alpha2Code":"TM","alpha3Code":"TKM","flag":"🇹🇲"},{"name":"Turks and Caicos Islands","alpha2Code":"TC","alpha3Code":"TCA","flag":"🇹🇨"},{"name":"Tuvalu","alpha2Code":"TV","alpha3Code":"TUV","flag":"🇹🇻"},{"name":"Türkiye","alpha2Code":"TR","alpha3Code":"TUR","flag":"🇹🇷"},{"name":"Uganda","alpha2Code":"UG","alpha3Code":"UGA","flag":"🇺🇬"},{"name":"Ukraine","alpha2Code":"UA","alpha3Code":"UKR","flag":"🇺🇦"},{"name":"United Arab Emirates","alpha2Code":"AE","alpha3Code":"ARE","flag":"🇦🇪"},{"name":"United Kingdom","alpha2Code":"GB","alpha3Code":"GBR","flag":"🇬🇧"},{"name":"United States","alpha2Code":"US","alpha3Code":"USA","flag":"🇺🇸"},{"name":"United States Minor Outlying Islands","alpha2Code":"UM","alpha3Code":"UMI","flag":"🇺🇲"},{"name":"Uruguay","alpha2Code":"UY","alpha3Code":"URY","flag":"🇺🇾"},{"name":"Uzbekistan","alpha2Code":"UZ","alpha3Code":"UZB","flag":"🇺🇿"},{"name":"Vanuatu","alpha2Code":"VU","alpha3Code":"VUT","flag":"🇻🇺"},{"name":"Venezuela, Bolivarian Republic of","alpha2Code":"VE","alpha3Code":"VEN","flag":"🇻🇪"},{"name":"Viet Nam","alpha2Code":"VN","alpha3Code":"VNM","flag":"🇻🇳"},{"name":"Virgin Islands, British","alpha2Code":"VG","alpha3Code":"VGB","flag":"🇻🇬"},{"name":"Virgin Islands, U.S.","alpha2Code":"VI","alpha3Code":"VIR","flag":"🇻🇮"},{"name":"Wallis and Futuna","alpha2Code":"WF","alpha3Code":"WLF","flag":"🇼🇫"},{"name":"Western Sahara","alpha2Code":"EH","alpha3Code":"ESH","flag":"🇪🇭"},{"name":"Yemen","alpha2Code":"YE","alpha3Code":"YEM","flag":"🇾🇪"},{"name":"Zambia","alpha2Code":"ZM","alpha3Code":"ZMB","flag":"🇿🇲"},{"name":"Zimbabwe","alpha2Code":"ZW","alpha3Code":"ZWE","flag":"🇿🇼"},{"name":"Åland Islands","alpha2Code":"AX","alpha3Code":"ALA","flag":"🇦🇽"}];
app.get('/api/countries', async (_req, res) => {
  try {
    const response = await fetch('https://countries.dev/countries?fields=name,alpha2Code,alpha3Code,flag&sort=name');
    if (!response.ok) throw new Error(`countries.dev HTTP ${response.status}`);
    const raw = await response.json();
    if (!Array.isArray(raw)) throw new Error('Country list format was unexpected');
    const countries = raw.map(c => ({
      name: typeof c.name === 'string' ? c.name : (c.name?.common || c.name?.official || ''),
      alpha2Code: String(c.alpha2Code || c.cca2 || '').toUpperCase(),
      alpha3Code: String(c.alpha3Code || c.cca3 || '').toUpperCase(),
      flag: typeof c.flag === 'string' && c.flag.length < 16 ? c.flag : (c.flags?.emoji || '')
    })).filter(c => c.name && /^[A-Z]{3}$/.test(c.alpha3Code));
    if (!countries.length) throw new Error('Country list was empty after normalization');
    countries.sort((a, b) => a.name.localeCompare(b.name));
    res.set('Cache-Control', 'public, max-age=86400');
    return res.json(countries);
  } catch (error) {
    console.error('Country list API unavailable; using bundled fallback:', error.message);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.json(STATIC_COUNTRY_FALLBACK);
  }
});

app.get('/api/country-info', async (req, res) => {
  try {
    const airport = String(req.query.airport || '').trim().toUpperCase();
    const city = String(req.query.city || '').trim();
    if (!/^[A-Z]{3}$/.test(airport) || !city || city.length > 100) {
      return res.status(400).json({ error: 'A valid airport IATA code and city are required.' });
    }
    const data = await getCountryInfoForAirport(airport, city);
    return res.json(data);
  } catch (error) {
    console.error('Country information API error:', error);
    return res.status(502).json({ error: 'Country information is temporarily unavailable.' });
  }
});

app.get('/api/visa/check', async (req, res) => {
  try {
    const passport = String(req.query.passport || '').trim().toUpperCase();
    const destination = String(req.query.destination || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(passport) || !/^[A-Z]{3}$/.test(destination)) {
      return res.status(400).json({ error: 'Passport and destination must be ISO alpha-3 country codes.' });
    }
    const apiKey = process.env.ORIZN_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Visa lookup is not configured on the server.' });
    const url = new URL('https://visa.orizn.app/api/v1/visa/check');
    url.searchParams.set('passport', passport);
    url.searchParams.set('destination', destination);
    const response = await fetch(url, { headers: { 'x-api-key': apiKey, 'Accept': 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 502 : response.status;
      return res.status(status).json({ error: response.status === 429 ? 'Visa API monthly quota reached.' : response.status === 404 ? 'No verified record for this passport/destination pair.' : 'Visa data is temporarily unavailable.' });
    }
    // A missing record must remain unknown, never be treated as visa-free.
    if (!data.requirement) return res.status(404).json({ error: 'No confirmed visa data for this pair.' });
    return res.json({ passport: data.passport || passport, destination: data.destination || destination, requirement: data.requirement, visa_free_days: data.visa_free_days ?? null, last_verified: data.last_verified || null });
  } catch (error) {
    console.error('Visa API error:', error);
    return res.status(502).json({ error: 'Visa data is temporarily unavailable.' });
  }
});

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

    // Return only a flight matching the requested number and exact route.
    const flight = results[0];

    return res.json({
      flight: formatFlight(flight),
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


// Instagram feed for the Air-AI News page. Keep the access token server-side.
let instagramFeedCache = { at: 0, items: null };
const INSTAGRAM_FEED_CACHE_TTL = 5 * 60 * 1000;

app.get('/api/instagram-feed', async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
      return res.status(503).json({
        error: 'Instagram feed is not configured on the server.'
      });
    }

    if (instagramFeedCache.items && Date.now() - instagramFeedCache.at < INSTAGRAM_FEED_CACHE_TTL) {
      res.set('Cache-Control', 'private, max-age=60');
      return res.json({ items: instagramFeedCache.items });
    }

    const url = new URL('https://graph.instagram.com/v25.0/me/media');
    url.searchParams.set('fields', 'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url');
    url.searchParams.set('limit', '12');
    url.searchParams.set('access_token', token);

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.error) {
      console.error('Instagram feed API error:', {
        status: response.status,
        message: payload?.error?.message || 'Instagram API request failed'
      });
      return res.status(502).json({
        error: 'Instagram posts are temporarily unavailable.'
      });
    }

    const items = (Array.isArray(payload.data) ? payload.data : [])
      .filter(item => item && item.id && item.permalink)
      .map(item => ({
        id: String(item.id),
        caption: typeof item.caption === 'string' ? item.caption : '',
        mediaType: String(item.media_type || 'IMAGE'),
        mediaUrl: typeof item.media_url === 'string' ? item.media_url : null,
        thumbnailUrl: typeof item.thumbnail_url === 'string' ? item.thumbnail_url : null,
        permalink: String(item.permalink),
        timestamp: typeof item.timestamp === 'string' ? item.timestamp : null
      }));

    instagramFeedCache = { at: Date.now(), items };
    res.set('Cache-Control', 'private, max-age=60');
    return res.json({ items });
  } catch (error) {
    console.error('Instagram feed route failed:', error.message);
    return res.status(502).json({
      error: 'Instagram posts are temporarily unavailable.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Air-AI Aviationstack API listening on :${PORT}`);
});





















