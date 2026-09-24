// Air-AI flight lookup backend
// Aviationstack API — API key is stored in Render Environment Variables.

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.AVIATIONSTACK_API_KEY;

app.use(express.static('.'));

app.get('/', (_req, res) => {
  res.sendFile(
    new URL('./Air-AI_version7_local_AI.html', import.meta.url).pathname
  );
});

function first(...values) {
  return values.find(
    value =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
  ) ?? null;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');
}

const cityAliases = {
  москва: ['moscow', 'svo', 'dme', 'vko'],
  санктпетербург: ['saintpetersburg', 'stpetersburg', 'pulkovo', 'led'],
  сочи: ['sochi', 'aer'],
  казань: ['kazan', 'kzn'],
  екатеринбург: ['yekaterinburg', 'ekaterinburg', 'svx'],
  калининград: ['kaliningrad', 'kgd'],
  минск: ['minsk', 'msq'],
  ереван: ['yerevan', 'evn'],
  дубай: ['dubai', 'dxb'],
  анталья: ['antalya', 'ayt'],
  ташкент: ['tashkent', 'tas'],
  баку: ['baku', 'gyd'],
  тбилиси: ['tbilisi', 'tbs'],
  новосибирск: ['novosibirsk', 'ovb'],
  самара: ['samara', 'kuf'],
  уфа: ['ufa', 'ufa'],
  пермь: ['perm', 'pee'],
  нижнийновгород: ['nizhny', 'nizhniy', 'goj'],
  ростовнадону: ['rostov', 'rov']
};

function matchesCity(input, flight) {
  const wanted = normalize(input);

  const destinations = [
    flight?.arrival?.airport,
    flight?.arrival?.airport?.name,
    flight?.arrival?.airport?.iata,
    flight?.arrival?.airport?.icao,
    flight?.arrival?.timezone
  ]
    .filter(Boolean)
    .map(normalize);

  if (destinations.some(value => value === wanted || value.includes(wanted))) {
    return true;
  }

  for (const [city, aliases] of Object.entries(cityAliases)) {
    const all = [city, ...aliases].map(normalize);

    if (
      all.includes(wanted) &&
      destinations.some(destination =>
        all.some(alias => destination.includes(alias))
      )
    ) {
      return true;
    }
  }

  return false;
}

function formatFlight(flight) {
  return {
    flightNumber: first(
      flight?.flight?.iata,
      flight?.flight?.number,
      flight?.flight?.icao
    ),

    airline: first(
      flight?.airline?.name,
      flight?.airline?.iata,
      flight?.airline?.icao
    ),

    departureAirport: first(
      flight?.departure?.airport,
      flight?.departure?.iata,
      flight?.departure?.icao
    ),

    departureIata: first(
      flight?.departure?.iata
    ),

    destination: first(
      flight?.arrival?.airport,
      flight?.arrival?.iata,
      flight?.arrival?.icao
    ),

    destinationIata: first(
      flight?.arrival?.iata
    ),

    departureTime: first(
      flight?.departure?.estimated,
      flight?.departure?.scheduled,
      flight?.departure?.actual
    ),

    arrivalTime: first(
      flight?.arrival?.estimated,
      flight?.arrival?.scheduled,
      flight?.arrival?.actual
    ),

    status: first(
      flight?.flight_status,
      flight?.status
    ),

    aircraft: first(
      flight?.aircraft?.registration,
      flight?.aircraft?.iata,
      flight?.aircraft?.icao
    ),

    terminal: first(
      flight?.departure?.terminal
    ),

    gate: first(
      flight?.departure?.gate
    )
  };
}

app.get('/api/flight', async (req, res) => {
  const city = String(req.query.city || '').trim();

  if (!city) {
    return res.status(400).json({
      error: 'Укажите город / Enter destination city'
    });
  }

  if (!API_KEY) {
    return res.status(500).json({
      error: 'AVIATIONSTACK_API_KEY is not configured on Render'
    });
  }

  try {
    const url =
      `https://api.aviationstack.com/v1/flights` +
      `?access_key=${encodeURIComponent(API_KEY)}` +
      `&limit=100`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || data?.error) {
      return res.status(502).json({
        error: 'Aviationstack API error',
        details: data?.error || `HTTP ${response.status}`
      });
    }

    const flights = Array.isArray(data?.data)
      ? data.data
      : [];

    const matching = flights.filter(flight =>
      matchesCity(city, flight)
    );

    if (!matching.length) {
      return res.json({
        flight: null,
        source: 'Aviationstack',
        searchedCity: city,
        totalFlightsReceived: flights.length,
        note: 'No matching flight found in the current Aviationstack response.'
      });
    }

    const flight = formatFlight(matching[0]);

    return res.json({
      flight,
      source: 'Aviationstack',
      searchedCity: city,
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Flight search failed',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Air-AI Aviationstack API listening on :${PORT}`
  );
});
