/* ============================================================
   Data + helpers
   Prayer times are computed with adhan-js (vendor/adhan.min.js) when
   it is loaded, falling back to the built-in approximation below.
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
// lib = adhan-js CalculationMethod name
const METHODS = {
  isna:         { label:'ISNA',                   region:'North America',   fajrAngle:15,   ishaAngle:15,   lib:'NorthAmerica' },
  mwl:          { label:'Muslim World League',    region:'Global',          fajrAngle:18,   ishaAngle:17,   lib:'MuslimWorldLeague' },
  egypt:        { label:'Egyptian Authority',     region:'Africa',          fajrAngle:19.5, ishaAngle:17.5, lib:'Egyptian' },
  makkah:       { label:'Umm al-Qurā',            region:'Saudi Arabia',    fajrAngle:18.5, ishaInterval:90, lib:'UmmAlQura' },
  karachi:      { label:'Karachi',                region:'South Asia',      fajrAngle:18,   ishaAngle:18,   lib:'Karachi' },
  moonsighting: { label:'Moonsighting Committee', region:'Shafaq · general',fajrAngle:18,   ishaAngle:18,   lib:'MoonsightingCommittee' },
};

/* Fallback location (Ottawa) used when GPS is unavailable and no city is chosen */
const LOC_DEFAULT = { lat:45.4215, lon:-75.6972, city:'Ottawa, ON' };

/* Offline city list for the manual location picker (and naming GPS fixes) */
const CITIES = [
  ['Ottawa, ON',45.4215,-75.6972],['Gatineau, QC',45.4765,-75.7013],['Toronto, ON',43.6532,-79.3832],
  ['Mississauga, ON',43.5890,-79.6441],['Brampton, ON',43.7315,-79.7624],['Hamilton, ON',43.2557,-79.8711],
  ['London, ON',42.9849,-81.2453],['Windsor, ON',42.3149,-83.0364],['Kitchener-Waterloo, ON',43.4516,-80.4925],
  ['Kingston, ON',44.2312,-76.4860],['Montréal, QC',45.5019,-73.5674],['Québec, QC',46.8139,-71.2080],
  ['Sherbrooke, QC',45.4042,-71.8929],['Halifax, NS',44.6488,-63.5752],['Moncton, NB',46.0878,-64.7782],
  ["St. John's, NL",47.5615,-52.7126],['Winnipeg, MB',49.8951,-97.1384],['Regina, SK',50.4452,-104.6189],
  ['Saskatoon, SK',52.1332,-106.6700],['Calgary, AB',51.0447,-114.0719],['Edmonton, AB',53.5461,-113.4938],
  ['Vancouver, BC',49.2827,-123.1207],['Surrey, BC',49.1913,-122.8490],['Victoria, BC',48.4284,-123.3656],
  ['New York, NY',40.7128,-74.0060],['Detroit, MI',42.3314,-83.0458],['Chicago, IL',41.8781,-87.6298],
  ['Boston, MA',42.3601,-71.0589],['Washington, DC',38.9072,-77.0369],['Philadelphia, PA',39.9526,-75.1652],
  ['Atlanta, GA',33.7490,-84.3880],['Houston, TX',29.7604,-95.3698],['Dallas, TX',32.7767,-96.7970],
  ['Minneapolis, MN',44.9778,-93.2650],['Los Angeles, CA',34.0522,-118.2437],['San Francisco, CA',37.7749,-122.4194],
  ['Seattle, WA',47.6062,-122.3321],['London, UK',51.5072,-0.1276],['Birmingham, UK',52.4862,-1.8904],
  ['Paris, France',48.8566,2.3522],['Istanbul, Türkiye',41.0082,28.9784],['Cairo, Egypt',30.0444,31.2357],
  ['Makkah, Saudi Arabia',21.3891,39.8579],['Madīnah, Saudi Arabia',24.5247,39.5692],['Dubai, UAE',25.2048,55.2708],
  ['Amman, Jordan',31.9539,35.9106],['Casablanca, Morocco',33.5731,-7.5898],['Fès, Morocco',34.0181,-5.0078],
  ['Tunis, Tunisia',36.8065,10.1815],['Algiers, Algeria',36.7538,3.0588],['Nouakchott, Mauritania',18.0735,-15.9582],
  ['Dakar, Senegal',14.7167,-17.4677],['Banjul, The Gambia',13.4549,-16.5790],['Bamako, Mali',12.6392,-8.0029],
  ['Lagos, Nigeria',6.5244,3.3792],['Kano, Nigeria',12.0022,8.5920],['Khartoum, Sudan',15.5007,32.5599],
  ['Nairobi, Kenya',-1.2921,36.8219],['Mogadishu, Somalia',2.0469,45.3182],['Cape Town, South Africa',-33.9249,18.4241],
  ['Karachi, Pakistan',24.8607,67.0011],['Lahore, Pakistan',31.5204,74.3587],['Delhi, India',28.7041,77.1025],
  ['Dhaka, Bangladesh',23.8103,90.4125],['Kuala Lumpur, Malaysia',3.1390,101.6869],['Jakarta, Indonesia',-6.2088,106.8456],
  ['Sydney, Australia',-33.8688,151.2093],['Melbourne, Australia',-37.8136,144.9631],
].map(function(c){ return { city:c[0], lat:c[1], lon:c[2] }; });

function _distKm(aLat,aLon,bLat,bLon){
  const R=6371, dLat=_d2r(bLat-aLat), dLon=_d2r(bLon-aLon);
  const h=Math.sin(dLat/2)**2 + Math.cos(_d2r(aLat))*Math.cos(_d2r(bLat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
/* Name a GPS fix after the nearest listed city (within 40 km), else null */
function nearestCity(lat, lon){
  let best=null, bd=Infinity;
  CITIES.forEach(function(c){ const d=_distKm(lat,lon,c.lat,c.lon); if(d<bd){ bd=d; best=c; } });
  return bd<=40 ? best.city : null;
}
function fmtCoords(lat, lon){
  return `${Math.abs(lat).toFixed(2)}°${lat>=0?'N':'S'}, ${Math.abs(lon).toFixed(2)}°${lon>=0?'E':'W'}`;
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
  date = date || todayDate();
  lat  = (lat  != null) ? lat  : LOC_DEFAULT.lat;
  lon  = (lon  != null) ? lon  : LOC_DEFAULT.lon;
  const precise = _computeAdhan(prefs, date, lat, lon);
  if(precise) return precise;

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

/* Precise times via adhan-js (same engine as most prayer apps). Returns null if not loaded. */
function _computeAdhan(prefs, date, lat, lon){
  const A = window.adhan;
  if(!A) return null;
  try {
    const m = METHODS[prefs.method] || METHODS.isna;
    const coords = new A.Coordinates(lat, lon);
    const params = A.CalculationMethod[m.lib]();
    params.madhab = prefs.madhab === 'hanafi' ? A.Madhab.Hanafi : A.Madhab.Shafi;
    params.highLatitudeRule = A.HighLatitudeRule.recommended(coords);
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const pt  = new A.PrayerTimes(coords, day, params);
    const mid = +day;
    const mins = function(t){ return Math.round((+t - mid)/60000); };
    return { fajr:mins(pt.fajr), sunrise:mins(pt.sunrise), dhuhr:mins(pt.dhuhr),
             asr:mins(pt.asr), maghrib:mins(pt.maghrib), isha:mins(pt.isha) };
  } catch(e){ return null; }
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

// Today's date at local midnight — always recomputed so the app rolls over
// correctly when left open past midnight (and across DST changes).
function todayDate(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
const TODAY = todayDate(); // legacy; prefer todayDate()

// Current time in minutes from midnight, live
function nowMinutes(){ const n=new Date(); return n.getHours()*60+n.getMinutes(); }

Object.assign(window, {
  PRAYERS, METHODS, computeTimes, LOC_DEFAULT, CITIES, nearestCity, fmtCoords, todayDate,
  fmt, dayOrder, nextPrayer,
  countdown, HIJRI_MONTHS, gToHijri, WEEKDAYS, WEEKDAYS_S, GMONTHS, TODAY,
  nowMinutes,
});
