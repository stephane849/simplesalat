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

/* Fallback location (Ottawa) used when GPS is unavailable */
const LOC_DEFAULT = { lat:45.4215, lon:-75.6972, city:'Ottawa, ON' };

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
  PRAYERS, METHODS, computeTimes, LOC_DEFAULT,
  fmt, dayOrder, nextPrayer,
  countdown, HIJRI_MONTHS, gToHijri, WEEKDAYS, WEEKDAYS_S, GMONTHS, TODAY,
  nowMinutes,
});
