/* ============================================================
   Data + helpers — Ottawa, ON (45.42°N, 75.70°W)
   Prayer times computed astronomically for the real current date.
   ============================================================ */

const PRAYERS = [
  { key:'fajr',    en:'Fajr',    ar:'الفجر',  prayer:true  },
  { key:'sunrise', en:'Sunrise', ar:'الشروق', prayer:false },
  { key:'dhuhr',   en:'Dhuhr',   ar:'الظهر',  prayer:true  },
  { key:'asr',     en:'Asr',     ar:'العصر',  prayer:true  },
  { key:'maghrib', en:'Maghrib', ar:'المغرب', prayer:true  },
  { key:'isha',    en:'Isha',    ar:'العشاء', prayer:true  },
];

// fajrAngle / ishaAngle = degrees below horizon
// ishaInterval = fixed minutes after Maghrib (Umm al-Qurā)
const METHODS = {
  isna:         { label:'ISNA',                   region:'North America',   fajrAngle:15,   ishaAngle:15   },
  mwl:          { label:'Muslim World League',    region:'Global',          fajrAngle:18,   ishaAngle:17   },
  egypt:        { label:'Egyptian Authority',     region:'Africa',          fajrAngle:19.5, ishaAngle:17.5 },
  makkah:       { label:'Umm al-Qurā',            region:'Saudi Arabia',    fajrAngle:18.5, ishaInterval:90 },
  karachi:      { label:'Karachi',                region:'South Asia',      fajrAngle:18,   ishaAngle:18   },
  moonsighting: { label:'Moonsighting Committee', region:'Shafaq · general',fajrAngle:18,   ishaAngle:18   },
};

/* Fallback location (Ottawa) used when GPS is unavailable and nothing is set */
const LOC_DEFAULT = { lat:45.4215, lon:-75.6972, city:'Ottawa, ON' };

/* Bundled city list for manual location — no network lookup needed.
   Grouped by region; order here is the order shown on the Location screen. */
const CITY_REGIONS = [
  { region:'North America', cities:[
    { city:'Ottawa, ON',      lat:45.42,  lon:-75.70 },
    { city:'Toronto, ON',     lat:43.65,  lon:-79.38 },
    { city:'Montréal, QC',    lat:45.51,  lon:-73.57 },
    { city:'Québec, QC',      lat:46.81,  lon:-71.21 },
    { city:'Halifax, NS',     lat:44.65,  lon:-63.58 },
    { city:'Winnipeg, MB',    lat:49.90,  lon:-97.14 },
    { city:'Calgary, AB',     lat:51.05,  lon:-114.07 },
    { city:'Edmonton, AB',    lat:53.55,  lon:-113.49 },
    { city:'Vancouver, BC',   lat:49.28,  lon:-123.12 },
    { city:'New York, NY',    lat:40.71,  lon:-74.01 },
    { city:'Boston, MA',      lat:42.36,  lon:-71.06 },
    { city:'Philadelphia, PA',lat:39.95,  lon:-75.17 },
    { city:'Washington, DC',  lat:38.91,  lon:-77.04 },
    { city:'Atlanta, GA',     lat:33.75,  lon:-84.39 },
    { city:'Miami, FL',       lat:25.76,  lon:-80.19 },
    { city:'Detroit, MI',     lat:42.33,  lon:-83.05 },
    { city:'Chicago, IL',     lat:41.88,  lon:-87.63 },
    { city:'Minneapolis, MN', lat:44.98,  lon:-93.27 },
    { city:'Dallas, TX',      lat:32.78,  lon:-96.80 },
    { city:'Houston, TX',     lat:29.76,  lon:-95.37 },
    { city:'Denver, CO',      lat:39.74,  lon:-104.99 },
    { city:'Phoenix, AZ',     lat:33.45,  lon:-112.07 },
    { city:'Los Angeles, CA', lat:34.05,  lon:-118.24 },
    { city:'San Francisco, CA', lat:37.77, lon:-122.42 },
    { city:'Seattle, WA',     lat:47.61,  lon:-122.33 },
    { city:'Mexico City',     lat:19.43,  lon:-99.13 },
  ]},
  { region:'Europe', cities:[
    { city:'London',      lat:51.51, lon:-0.13 },
    { city:'Birmingham',  lat:52.49, lon:-1.89 },
    { city:'Manchester',  lat:53.48, lon:-2.24 },
    { city:'Dublin',      lat:53.35, lon:-6.26 },
    { city:'Paris',       lat:48.86, lon:2.35 },
    { city:'Marseille',   lat:43.30, lon:5.37 },
    { city:'Brussels',    lat:50.85, lon:4.35 },
    { city:'Amsterdam',   lat:52.37, lon:4.90 },
    { city:'Berlin',      lat:52.52, lon:13.40 },
    { city:'Cologne',     lat:50.94, lon:6.96 },
    { city:'Frankfurt',   lat:50.11, lon:8.68 },
    { city:'Munich',      lat:48.14, lon:11.58 },
    { city:'Vienna',      lat:48.21, lon:16.37 },
    { city:'Zürich',      lat:47.38, lon:8.54 },
    { city:'Madrid',      lat:40.42, lon:-3.70 },
    { city:'Barcelona',   lat:41.39, lon:2.17 },
    { city:'Rome',        lat:41.90, lon:12.50 },
    { city:'Milan',       lat:45.46, lon:9.19 },
    { city:'Copenhagen',  lat:55.68, lon:12.57 },
    { city:'Oslo',        lat:59.91, lon:10.75 },
    { city:'Stockholm',   lat:59.33, lon:18.07 },
    { city:'Sarajevo',    lat:43.86, lon:18.41 },
    { city:'Kyiv',        lat:50.45, lon:30.52 },
    { city:'Moscow',      lat:55.76, lon:37.62 },
    { city:'Istanbul',    lat:41.01, lon:28.98 },
    { city:'Ankara',      lat:39.93, lon:32.86 },
  ]},
  { region:'Middle East & North Africa', cities:[
    { city:'Makkah',      lat:21.42, lon:39.83 },
    { city:'Madīnah',     lat:24.47, lon:39.61 },
    { city:'Jeddah',      lat:21.49, lon:39.19 },
    { city:'Riyadh',      lat:24.71, lon:46.68 },
    { city:'Dubai',       lat:25.20, lon:55.27 },
    { city:'Abu Dhabi',   lat:24.45, lon:54.38 },
    { city:'Doha',        lat:25.29, lon:51.53 },
    { city:'Manama',      lat:26.23, lon:50.59 },
    { city:'Kuwait City', lat:29.38, lon:47.99 },
    { city:'Muscat',      lat:23.59, lon:58.41 },
    { city:'Sanaa',       lat:15.37, lon:44.19 },
    { city:'Baghdad',     lat:33.31, lon:44.36 },
    { city:'Tehran',      lat:35.69, lon:51.39 },
    { city:'Amman',       lat:31.95, lon:35.93 },
    { city:'Jerusalem',   lat:31.78, lon:35.22 },
    { city:'Gaza',        lat:31.50, lon:34.47 },
    { city:'Beirut',      lat:33.89, lon:35.50 },
    { city:'Damascus',    lat:33.51, lon:36.29 },
    { city:'Cairo',       lat:30.04, lon:31.24 },
    { city:'Alexandria',  lat:31.20, lon:29.92 },
    { city:'Khartoum',    lat:15.50, lon:32.56 },
    { city:'Tripoli',     lat:32.89, lon:13.19 },
    { city:'Tunis',       lat:36.81, lon:10.18 },
    { city:'Algiers',     lat:36.75, lon:3.06 },
    { city:'Casablanca',  lat:33.57, lon:-7.59 },
    { city:'Rabat',       lat:34.02, lon:-6.84 },
  ]},
  { region:'Africa', cities:[
    { city:'Lagos',        lat:6.52,   lon:3.38 },
    { city:'Abuja',        lat:9.06,   lon:7.49 },
    { city:'Kano',         lat:12.00,  lon:8.52 },
    { city:'Accra',        lat:5.60,   lon:-0.19 },
    { city:'Dakar',        lat:14.72,  lon:-17.47 },
    { city:'Bamako',       lat:12.64,  lon:-8.00 },
    { city:'Nairobi',      lat:-1.29,  lon:36.82 },
    { city:'Mogadishu',    lat:2.05,   lon:45.32 },
    { city:'Addis Ababa',  lat:9.03,   lon:38.74 },
    { city:'Johannesburg', lat:-26.20, lon:28.05 },
    { city:'Cape Town',    lat:-33.92, lon:18.42 },
  ]},
  { region:'South & Central Asia', cities:[
    { city:'Karachi',    lat:24.86, lon:67.01 },
    { city:'Lahore',     lat:31.55, lon:74.34 },
    { city:'Islamabad',  lat:33.68, lon:73.05 },
    { city:'Peshawar',   lat:34.02, lon:71.58 },
    { city:'Kabul',      lat:34.53, lon:69.17 },
    { city:'Delhi',      lat:28.61, lon:77.21 },
    { city:'Mumbai',     lat:19.08, lon:72.88 },
    { city:'Hyderabad',  lat:17.39, lon:78.49 },
    { city:'Kolkata',    lat:22.57, lon:88.36 },
    { city:'Chennai',    lat:13.08, lon:80.27 },
    { city:'Bengaluru',  lat:12.97, lon:77.59 },
    { city:'Dhaka',      lat:23.81, lon:90.41 },
    { city:'Chattogram', lat:22.36, lon:91.78 },
    { city:'Colombo',    lat:6.93,  lon:79.86 },
    { city:'Tashkent',   lat:41.30, lon:69.24 },
    { city:'Almaty',     lat:43.24, lon:76.89 },
    { city:'Baku',       lat:40.41, lon:49.87 },
  ]},
  { region:'East & Southeast Asia', cities:[
    { city:'Kuala Lumpur', lat:3.14,  lon:101.69 },
    { city:'Singapore',    lat:1.35,  lon:103.82 },
    { city:'Jakarta',      lat:-6.21, lon:106.85 },
    { city:'Bandung',      lat:-6.92, lon:107.61 },
    { city:'Surabaya',     lat:-7.25, lon:112.75 },
    { city:'Medan',        lat:3.60,  lon:98.68 },
    { city:'Manila',       lat:14.60, lon:120.98 },
    { city:'Bangkok',      lat:13.76, lon:100.50 },
    { city:'Hong Kong',    lat:22.32, lon:114.17 },
    { city:'Ürümqi',       lat:43.83, lon:87.62 },
    { city:'Beijing',      lat:39.90, lon:116.41 },
    { city:'Shanghai',     lat:31.23, lon:121.47 },
    { city:'Seoul',        lat:37.57, lon:126.98 },
    { city:'Tokyo',        lat:35.68, lon:139.69 },
  ]},
  { region:'Oceania & South America', cities:[
    { city:'Sydney',       lat:-33.87, lon:151.21 },
    { city:'Melbourne',    lat:-37.81, lon:144.96 },
    { city:'Perth',        lat:-31.95, lon:115.86 },
    { city:'Auckland',     lat:-36.85, lon:174.76 },
    { city:'São Paulo',    lat:-23.55, lon:-46.63 },
    { city:'Buenos Aires', lat:-34.60, lon:-58.38 },
  ]},
];

/* "45.42°N, 75.70°W" */
function coordStr(lat, lon){
  return Math.abs(lat).toFixed(2)+'°'+(lat>=0?'N':'S')+', '
       + Math.abs(lon).toFixed(2)+'°'+(lon>=0?'E':'W');
}

/* Nearest bundled city within maxKm, or null — used to name a GPS fix */
function nearestCity(lat, lon, maxKm){
  maxKm = maxKm || 80;
  var best = null, bestKm = Infinity;
  var latRad = _d2r(lat);
  CITY_REGIONS.forEach(function(grp){
    grp.cities.forEach(function(c){
      var dy = (c.lat - lat) * 111.2;
      var dx = (c.lon - lon) * 111.2 * Math.cos(latRad);
      var km = Math.sqrt(dx*dx + dy*dy);
      if(km < bestKm){ bestKm = km; best = c; }
    });
  });
  return bestKm <= maxKm ? best.city : null;
}

/* Display name for a { lat, lon, city? } — falls back to the default city */
function locName(loc){
  if(!loc) return LOC_DEFAULT.city;
  return loc.city || nearestCity(loc.lat, loc.lon) || coordStr(loc.lat, loc.lon);
}

/* Parse typed coordinates → { lat, lon } or null when out of range / not a number */
function parseCoords(latStr, lonStr){
  var lat = parseFloat(String(latStr).replace(',', '.'));
  var lon = parseFloat(String(lonStr).replace(',', '.'));
  if(!isFinite(lat) || !isFinite(lon)) return null;
  if(lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat:lat, lon:lon };
}

/* ── Solar maths (Spencer 1971 · ±1 min accuracy up to 65 °N) ── */
function _d2r(d){ return d*Math.PI/180; }
function _r2d(r){ return r*180/Math.PI; }

function _solar(date){
  const y   = date.getFullYear();
  const doy = Math.round((date - new Date(y,0,0)) / 86400000); // 1–366
  const B   = 2*Math.PI*(doy-1)/365;
  const decl = 0.006918 - 0.399912*Math.cos(B) + 0.070257*Math.sin(B)
             - 0.006758*Math.cos(2*B) + 0.000907*Math.sin(2*B)
             - 0.002697*Math.cos(3*B) + 0.001480*Math.sin(3*B); // radians
  const eqt  = 229.18*(0.000075 + 0.001868*Math.cos(B) - 0.032077*Math.sin(B)
             - 0.014615*Math.cos(2*B) - 0.04089*Math.sin(2*B));  // minutes
  return { decl, eqt };
}

// Hour angle in degrees for a given zenith angle (degrees)
function _ha(latDeg, declRad, zenithDeg){
  const cosH = (Math.cos(_d2r(zenithDeg)) - Math.sin(_d2r(latDeg))*Math.sin(declRad))
             / (Math.cos(_d2r(latDeg))*Math.cos(declRad));
  if(cosH <= -1) return 180;
  if(cosH >=  1) return 0;
  return _r2d(Math.acos(cosH));
}

function computeTimes(prefs, date, lat, lon){
  date = date || TODAY;
  lat  = (lat  != null) ? lat  : LOC_DEFAULT.lat;
  lon  = (lon  != null) ? lon  : LOC_DEFAULT.lon;

  const tz = -date.getTimezoneOffset();        // minutes east of UTC
  const { decl, eqt } = _solar(date);
  const noon = 720 - 4*lon - eqt + tz;        // solar noon, minutes from midnight

  const hDay   = _ha(lat, decl, 90.833);
  const sunrise = Math.round(noon - hDay*4);
  const maghrib = Math.round(noon + hDay*4);

  const m = METHODS[prefs.method] || METHODS.isna;
  const fajr = Math.round(noon - _ha(lat, decl, 90 + m.fajrAngle)*4);
  const isha = m.ishaInterval
    ? maghrib + m.ishaInterval
    : Math.round(noon + _ha(lat, decl, 90 + m.ishaAngle)*4);

  const factor  = prefs.madhab === 'hanafi' ? 2 : 1;
  const asrZ    = 90 - _r2d(Math.atan(1/(factor + Math.tan(Math.abs(_d2r(lat) - decl)))));
  const asr     = Math.round(noon + _ha(lat, decl, asrZ)*4);

  return { fajr, sunrise, dhuhr:Math.round(noon), asr, maghrib, isha };
}

/* ── Time helpers ── */
function fmt(min, is24){
  min = ((Math.round(min)%1440)+1440)%1440;
  const h=Math.floor(min/60), mm=min%60;
  const ampm = h<12?'AM':'PM', h12=((h+11)%12)+1;
  return {
    h: is24?h:h12, m:String(mm).padStart(2,'0'), ampm: is24?'':ampm,
    str: is24 ? `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
              : `${h12}:${String(mm).padStart(2,'0')}`,
  };
}

function nextPrayer(times, nowMin){
  const list = PRAYERS.filter(p=>p.prayer).map(p=>({key:p.key, t:times[p.key]}));
  for(const p of list){ if(p.t > nowMin) return p; }
  return { key:list[0].key, t:list[0].t+1440 };
}

function countdown(targetMin, nowMin){
  let d=targetMin-nowMin; if(d<0) d+=1440;
  const h=Math.floor(d/60), m=Math.floor(d%60);
  return { h, m, mins:Math.floor(d),
    long:  h>0?`${h}h ${String(m).padStart(2,'0')}m`:`${m} min`,
    clock: h>0?`${h}:${String(m).padStart(2,'0')}`:`${m}`,
  };
}

/* ── Gregorian → Hijri (Kuwaiti algorithm) ── */
const HIJRI_MONTHS = ['Muḥarram','Ṣafar','Rabīʿ al-Awwal','Rabīʿ al-Thānī',
  'Jumādā al-Ūlā','Jumādā al-Ākhirah','Rajab','Shaʿbān','Ramaḍān','Shawwāl',
  'Dhū al-Qaʿdah','Dhū al-Ḥijjah'];

function gToHijri(gy,gm,gd){
  let m=gm,y=gy; if(m<3){y-=1;m+=12;}
  const a=Math.floor(y/100),b=2-a+Math.floor(a/4);
  const jd=Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+gd+b-1524;
  let l=jd-1948440+10632;
  const n=Math.floor((l-1)/10631); l=l-10631*n+354;
  const j=Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)
          +Math.floor(l/5670)*Math.floor((43*l)/15238);
  l=l-Math.floor((30-j)/15)*Math.floor((17719*j)/50)
      -Math.floor(j/16)*Math.floor((15238*j)/43)+29;
  return { y:30*n+j-30, m:Math.floor((24*l)/709)-1, d:l-Math.floor((709*Math.floor((24*l)/709))/24) };
}

const WEEKDAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_S = ['S','M','T','W','T','F','S'];
const GMONTHS    = ['January','February','March','April','May','June','July',
                    'August','September','October','November','December'];

function dayOrder(times){ return PRAYERS.map(p=>({...p, t:times[p.key]})); }

// TODAY = actual current date (midnight)
const TODAY = new Date(); TODAY.setHours(0,0,0,0);

// Current time in minutes from midnight, live
function nowMinutes(){ const n=new Date(); return n.getHours()*60+n.getMinutes(); }

Object.assign(window, {
  PRAYERS, METHODS, computeTimes, LOC_DEFAULT, CITY_REGIONS,
  coordStr, locName, parseCoords, nearestCity,
  fmt, dayOrder, nextPrayer,
  countdown, HIJRI_MONTHS, gToHijri, WEEKDAYS, WEEKDAYS_S, GMONTHS, TODAY,
  nowMinutes,
});
