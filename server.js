// Air-AI no-key flight lookup backend (Node.js 18+)
// Primary source: PocketWorld public airport flight endpoint. No API key required.
import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('.'));
// Serve the main Air-AI page at the local root URL.
app.get('/', (_req, res) => res.sendFile(new URL('./Air-AI_version7_local_AI.html', import.meta.url).pathname));
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^a-zа-я0-9]/g,'');
const cityAliases = {
  'москва':['moscow','sheremetyevo','domodedovo','vnukovo','svo','vko','dme'], 'санктпетербург':['saintpetersburg','stpetersburg','петербург','пулково','led'],
  'сочи':['sochi'], 'казань':['kazan'], 'екатеринбург':['yekaterinburg','ekaterinburg'], 'калининград':['kaliningrad'],
  'минск':['minsk'], 'ереван':['yerevan'], 'дубай':['dubai'], 'анталья':['antalya'], 'ташкент':['tashkent'], 'баку':['baku'], 'тбилиси':['tbilisi'],
  'новосибирск':['novosibirsk'], 'самара':['samara'], 'уфа':['ufa'], 'пермь':['perm'], 'нижнийновгород':['nizhnynovgorod','nizhny'], 'ростовнадону':['rostovondon','rostov']
};
function first(...xs){return xs.find(x=>x!==undefined&&x!==null&&String(x).trim()!=='') ?? null;}
function get(obj, paths){ for(const path of paths){let v=obj; for(const k of path.split('.')) v=v?.[k]; if(v!==undefined&&v!==null&&String(v).trim()!=='') return v;} return null; }
function cityMatch(input, row){
  const wanted=norm(input);
  const dest=norm(first(get(row,['arrival.city','destination.city','arrivalCity','destination','to.city','to.name','arrival.airport.name','arrival.airportName','arrival.iataCode','arrival.iata','destinationCity','destination_name','to','arrival.airport.iata','arrival.airport.code','destination.iata','destination.iataCode','arrival.name','route.to']) ,''));
  if(dest && (dest===wanted || dest.includes(wanted) || wanted.includes(dest))) return true;
  for(const [ru,aliases] of Object.entries(cityAliases)) if([ru,...aliases].some(x=>norm(x)===wanted) && [ru,...aliases].some(x=>norm(x)===dest)) return true;
  return false;
}
function rowsFrom(j){
  if(Array.isArray(j)) return j;
  if(!j || typeof j!=='object') return [];
  for(const k of ['flights','data','departures','results','items','schedule','flightSchedules']){
    const v=j[k];
    if(Array.isArray(v)) return v;
    if(v && typeof v==='object'){
      for(const nested of ['flights','items','results','data']) if(Array.isArray(v[nested])) return v[nested];
    }
  }
  // Some airport feeds split outbound traffic into an object or use a nested airport payload.
  for(const path of ['departures.flights','departures.data','airport.departures','airport.flights','data.departures','data.flights','response.flights']){
    const v=path.split('.').reduce((o,k)=>o?.[k],j); if(Array.isArray(v)) return v;
  }
  return [];
}
function parseFlightDate(value){
  if(value===undefined||value===null||value==='') return null;
  if(typeof value==='number' || (typeof value==='string' && /^\d{10,13}$/.test(value.trim()))){
    const n=Number(value); return new Date(n<1e12?n*1000:n);
  }
  if(typeof value==='object'){
    const nested=first(value.local,value.utc,value.dateTime,value.date,value.time,value.estimated,value.scheduled);
    if(nested!==null) return parseFlightDate(nested);
  }
  const d=new Date(value); return Number.isNaN(d.getTime())?null:d;
}
function toFlight(x){
  return {
    flightNumber:first(get(x,['flight.iataNumber','flight.iata','flight.number','flightNumber','flight_number','iata','callsign','ident','Flight'])),
    airline:first(get(x,['airline.name','airlineName','airline','carrier.name','carrier','Airline'])),
    destination:first(get(x,['arrival.city','destination.city','arrivalCity','destination','to.city','to.name','arrival.airport.name','arrival.airportName','arrival.iataCode','arrival.iata','destinationCity','destination_name','to','arrival.airport.iata','arrival.airport.code','destination.iata','destination.iataCode','arrival.name','route.to'])),
    departureTime:first(get(x,['departure.estimatedTime','departure.scheduledTime','departure.time','departureTime','scheduledDeparture','scheduled_departure','scheduled','time','Time'])),
    arrivalTime:first(get(x,['arrival.estimatedTime','arrival.scheduledTime','arrival.time','arrivalTime','scheduledArrival','scheduled_arrival'])),
    status:first(get(x,['status','flight.status','Status'])),
    aircraft:first(get(x,['aircraft.model','aircraft.name','aircraft.type','aircraft.iataCode','aircraftType','aircraft_type','Aircraft'])),
    registration:first(get(x,['aircraft.regNumber','aircraft.registration','registration','regNumber','tail_number'])),
    terminal:first(get(x,['departure.terminal','terminal','Terminal'])),
    checkIn:first(get(x,['departure.checkIn','checkIn','checkInDesk','checkin','check_in'])),
    gate:first(get(x,['departure.gate','gate','Gate'])),
    duration:first(get(x,['duration','flightDuration'])),
    updatedAt:first(get(x,['updatedAt','updated_at','lastUpdated']))
  };
}
function htmlText(s){return String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim();}
function parsePulkovoBoard(html){
  const rows=[]; const trs=String(html).match(/<tr\b[\s\S]*?<\/tr>/gi)||[];
  for(const tr of trs){
    const cells=[...tr.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>htmlText(m[1]));
    if(cells.length<4) continue;
    const joined=cells.join(' ');
    // Board columns are typically time, flight, destination, airline, aircraft, status.
    if(!/\b[A-ZА-Я]{1,3}\s?\d{2,5}\b/i.test(joined)) continue;
    const flight=cells.find(x=>/^[A-ZА-Я]{1,3}\s?\d{2,5}$/i.test(x.replace(/\s+/g,' ').trim()))||'';
    const time=cells.find(x=>/^\d{1,2}:\d{2}$/.test(x))||'';
    const idx=cells.indexOf(flight);
    const destination=idx>=0?cells[idx+1]||'':'';
    const airline=idx>=0?cells[idx+2]||'':'';
    const aircraft=idx>=0?cells[idx+3]||'':'';
    const status=idx>=0?cells[idx+4]||'':'';
    rows.push({flightNumber:flight,destination,airline,aircraft,status,departureTime:time});
  }
  return rows;
}
app.get('/api/flight', async (req,res)=>{
  const city=String(req.query.city||'').trim();
  if(!city) return res.status(400).json({error:'Укажите город / Enter destination city'});
  const now=new Date(), end=new Date(now.getTime()+24*60*60*1000);
  const sources=[
    {name:'Официальное онлайн-табло Пулково',url:'https://pulkovoairport.ru/passengers/departure/?when=0',kind:'html'},
    {name:'PocketWorld public airport data',url:'https://pocketworld.org/api/airport/LED/flights',kind:'json'}
  ];
  const errors=[];
  for(const source of sources){
    try{
      const r=await fetch(source.url,{headers:{'Accept':source.kind==='json'?'application/json':'text/html,application/xhtml+xml','User-Agent':'Mozilla/5.0 Air-AI flight lookup'},signal:AbortSignal.timeout(12000)});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const body=await r.text();
      let rows=source.kind==='html'?parsePulkovoBoard(body):rowsFrom(JSON.parse(body));
      let matches=rows.filter(x=>cityMatch(city,x)).map(raw=>{
        const f=source.kind==='html'?raw:toFlight(raw);
        let dep=parseFlightDate(f.departureTime);
        if(source.kind==='html' && /^\d{1,2}:\d{2}$/.test(String(f.departureTime||''))){
          const [hh,mm]=f.departureTime.split(':').map(Number); dep=new Date(now); dep.setHours(hh,mm,0,0); if(dep<now) dep.setDate(dep.getDate()+1);
          f.departureTime=dep.toISOString();
        }
        return {raw,f,dep};
      }).filter(x=>x.dep&&!Number.isNaN(x.dep.getTime())&&x.dep>=now&&x.dep<=end).sort((a,b)=>a.dep-b.dep);
      if(!matches.length){errors.push(`${source.name}: no matching parsed rows`);continue;}
      const chosen=matches[0], flight=chosen.f;
      // For the official board, fill arrival time and other available details only when present.
      if(source.kind==='json'){
        const hex=first(get(chosen.raw,['aircraft.icao24','icao24','hex']));
        if(hex){try{const ar=await fetch(`https://api.adsb.lol/v2/hex/${encodeURIComponent(hex)}`,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(7000)});if(ar.ok){const aj=await ar.json();const a=aj?.aircraft?.[0]||aj?.[0];if(a){flight.aircraft=flight.aircraft||first(a.t,a.type);flight.registration=flight.registration||first(a.r,a.reg);}}}catch{}}
      }
      return res.json({flight,source:source.name,sourceUrl:source.url,checkedAt:now.toISOString()});
    }catch(e){errors.push(`${source.name}: ${e.message}`);}
  }
  return res.json({flight:null,source:'Pulkovo board + public data fallback',checkedAt:now.toISOString(),note:'No matching flight could be confirmed from available public sources.',diagnostics:errors});
});
app.listen(PORT,()=>console.log(`Air-AI no-key flight API listening on :${PORT}`));
