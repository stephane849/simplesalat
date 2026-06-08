/* ============================================================
   Data + helpers — Ottawa, ON · sample date Mon 8 June 2026
   Times in minutes from midnight. Pure-grayscale prototype.
   ============================================================ */

// Prayer definitions (English primary, Arabic secondary)
const PRAYERS = [
  { key:'fajr',    en:'Fajr',    ar:'الفجر',  prayer:true  },
  { key:'sunrise', en:'Sunrise', ar:'الشروق', prayer:false },
  { key:'dhuhr',   en:'Dhuhr',   ar:'الظهر',  prayer:true  },
  { key:'asr',     en:'Asr',     ar:'العصر',  prayer:true  },
  { key:'maghrib', en:'Maghrib', ar:'المغرب', prayer:true  },
  { key:'isha',    en:'Isha',    ar:'العشاء', prayer:true  },
];

// Calculation methods → Fajr / Isha (the angle-dependent ones)
const METHODS = {
  isna:    { label:'ISNA',          region:'North America', fajr:235, isha:1336 }, // 15° / 15°
  mwl:     { label:'Muslim World League', region:'Global', fajr:194, isha:1362 }, // 18° / 17°
  egypt:   { label:'Egyptian Authority', region:'Africa',  fajr:182, isha:1368 }, // 19.5° / 17.5°
  makkah:  { label:'Umm al-Qurā',   region:'Saudi Arabia',  fajr:190, isha:1341 }, // 18.5° / +90m
  karachi: { label:'Karachi',       region:'South Asia',    fajr:190, isha:1366 }, // 18° / 18°
  moonsighting: { label:'Moonsighting Committee', region:'Shafaq · general', fajr:206, isha:1351 }, // 18°/18° + seasonal
};

// Fixed (sun-derived) times for the sample day
const FIXED = { sunrise:314, dhuhr:784, maghrib:1251 };   // 5:14 / 13:04 / 20:51
const ASR   = { standard:1028, hanafi:1098 };             // 17:08 / 18:18

function computeTimes(prefs){
  const m = METHODS[prefs.method] || METHODS.isna;
  return {
    fajr:    m.fajr,
    sunrise: FIXED.sunrise,
    dhuhr:   FIXED.dhuhr,
    asr:     ASR[prefs.madhab] || ASR.standard,
    maghrib: FIXED.maghrib,
    isha:    m.isha,
  };
}

// minutes → {h12, h24, m, ampm}
function fmt(min, is24){
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min/60), mm = min%60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = ((h + 11) % 12) + 1;
  return {
    h: is24 ? h : h12,
    m: String(mm).padStart(2,'0'),
    ampm: is24 ? '' : ampm,
    str: is24 ? `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
              : `${h12}:${String(mm).padStart(2,'0')}`,
  };
}

// Given times map + current minutes → next prayer key + order
function dayOrder(times){ return PRAYERS.map(p => ({...p, t:times[p.key]})); }

function nextPrayer(times, nowMin){
  // consider only actual prayers (sunrise is informational)
  const list = PRAYERS.filter(p=>p.prayer).map(p=>({key:p.key, t:times[p.key]}));
  for(const p of list){ if(p.t > nowMin) return p; }
  // past Isha → tomorrow's Fajr
  return { key:list[0].key, t:list[0].t + 1440 };
}

// Humanized countdown "1h 46m" / "46 min"
function countdown(targetMin, nowMin){
  let d = targetMin - nowMin; if(d < 0) d += 1440;
  const h = Math.floor(d/60), m = Math.floor(d%60);
  return { h, m, mins:Math.floor(d),
    long: h>0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m} min`,
    clock: h>0 ? `${h}:${String(m).padStart(2,'0')}` : `${m}`,
    clockUnit: h>0 ? 'hr' : 'min' };
}

/* ---------- Gregorian → Hijri (Kuwaiti algorithm) ---------- */
const HIJRI_MONTHS = ['Muḥarram','Ṣafar','Rabīʿ al-Awwal','Rabīʿ al-Thānī',
  'Jumādā al-Ūlā','Jumādā al-Ākhirah','Rajab','Shaʿbān','Ramaḍān','Shawwāl',
  'Dhū al-Qaʿdah','Dhū al-Ḥijjah'];

function gToHijri(gy, gm, gd){
  let m = gm, y = gy;
  if(m < 3){ y -= 1; m += 12; }
  const a = Math.floor(y/100);
  const b = 2 - a + Math.floor(a/4);
  const jd = Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + gd + b - 1524;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l-1)/10631);
  l = l - 10631*n + 354;
  const j = Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)
          + Math.floor(l/5670)*Math.floor((43*l)/15238);
  l = l - Math.floor((30-j)/15)*Math.floor((17719*j)/50)
        - Math.floor(j/16)*Math.floor((15238*j)/43) + 29;
  const hm = Math.floor((24*l)/709);
  const hd = l - Math.floor((709*hm)/24);
  const hy = 30*n + j - 30;
  return { y:hy, m:hm-1, d:hd };   // m is 0-indexed for HIJRI_MONTHS
}

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_S = ['S','M','T','W','T','F','S'];
const GMONTHS = ['January','February','March','April','May','June','July','August',
  'September','October','November','December'];

// Sample "today"
const TODAY = new Date(2026, 5, 8); // 8 June 2026 (month 0-indexed)

// Qibla from Ottawa
const QIBLA = { bearing:57, label:'NE', distanceKm:10140, city:'Ottawa, ON' };

// Demo clock anchor: 4:22 PM → Asr (5:08) is next, 46 min away
const DEMO_ANCHOR_MIN = 16*60 + 22;

Object.assign(window, {
  PRAYERS, METHODS, FIXED, ASR, computeTimes, fmt, dayOrder, nextPrayer,
  countdown, HIJRI_MONTHS, gToHijri, WEEKDAYS, WEEKDAYS_S, GMONTHS, TODAY,
  QIBLA, DEMO_ANCHOR_MIN,
});
