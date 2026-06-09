/* ============================================================
   KompaktApp — one full app instance.
   `variant` (a|b|c) selects the HOME screen.
   `chrome`   true  = render inside KompaktFrame (design previews)
              false = fill the screen directly (APK build)
   ============================================================ */

const HOMES = { a:HomeLedger, b:HomeCountdown, c:HomeArc, d:HomeArcTimes };

var PREFS_DEFAULTS = {
  method:'isna', madhab:'standard', is24:false, hijriAdj:0,
  adhan:true, sound:'makkah', reminder:'At adhan', adhanVolume:80,
  notif:{ fajr:true, dhuhr:true, asr:true, maghrib:true, isha:true, sunrise:false },
};
function loadPrefs() {
  try {
    var stored = JSON.parse(localStorage.getItem('salat_prefs') || 'null');
    if (stored) return Object.assign({}, PREFS_DEFAULTS, stored, {
      notif: Object.assign({}, PREFS_DEFAULTS.notif, stored.notif)
    });
  } catch(e) {}
  return PREFS_DEFAULTS;
}

function KompaktApp({ variant='a', chrome=true }){
  const [screen, setScreen]   = React.useState('home');
  const [stack,  setStack]    = React.useState([]);
  const [prefs,  setPrefsRaw] = React.useState(loadPrefs);
  const setPrefs = function(patch){
    setPrefsRaw(function(p){
      var next = Object.assign({}, p, patch);
      try { localStorage.setItem('salat_prefs', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  // Real current time, ticking every second
  const [nowMin, setNowMin] = React.useState(nowMinutes);
  React.useEffect(()=>{
    const id = setInterval(()=> setNowMin(nowMinutes()), 1000);
    return ()=> clearInterval(id);
  }, []);

  // GPS location — null while loading, then { lat, lon }
  const [loc,       setLoc]     = React.useState(null);
  const [locStatus, setLocStat] = React.useState('loading');
  React.useEffect(()=>{
    if(!navigator.geolocation){ setLocStat('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      pos=>{ setLoc({lat:pos.coords.latitude, lon:pos.coords.longitude}); setLocStat('ok'); },
      ()=>  setLocStat('denied'),
      { enableHighAccuracy:false, timeout:10000, maximumAge:3600000 }
    );
  }, []);

  const lat   = loc ? loc.lat : null;
  const lon   = loc ? loc.lon : null;
  const times = computeTimes(prefs, null, lat, lon);

  React.useEffect(function(){
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdhanScheduler;
    if(!plugin) return;
    var offsets = {'At adhan':0,'5 minutes before':5,'10 minutes before':10,'15 minutes before':15};
    var off = offsets[prefs.reminder] || 0;
    var now = Date.now();
    var midnight = new Date(); midnight.setHours(0,0,0,0);
    var midMs = +midnight;
    ['fajr','dhuhr','asr','maghrib','isha'].forEach(function(key, i){
      if(!prefs.adhan || !prefs.notif[key]){
        plugin.cancel({id:i}).catch(function(){});
        return;
      }
      var fireMs = midMs + (times[key] - off) * 60000;
      if(fireMs <= now) fireMs += 86400000;
      plugin.schedule({id:i, triggerMs:fireMs, sound:prefs.sound||'makkah', volume:(prefs.adhanVolume||80)/100}).catch(function(){});
    });
  }, [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha,
      prefs.adhan, prefs.sound, prefs.reminder, prefs.adhanVolume,
      prefs.notif.fajr, prefs.notif.dhuhr, prefs.notif.asr,
      prefs.notif.maghrib, prefs.notif.isha]);

  const [adhanPlaying, setAdhanPlaying] = React.useState(false);
  React.useEffect(function(){
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdhanScheduler;
    if(!plugin || !plugin.isAdhanPlaying) return;
    var id = setInterval(function(){
      plugin.isAdhanPlaying().then(function(r){ setAdhanPlaying(!!r.playing); }).catch(function(){});
    }, 1500);
    return function(){ clearInterval(id); };
  }, []);
  const stopAdhan = function(){
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdhanScheduler;
    if(plugin && plugin.stopAdhan) plugin.stopAdhan({});
    setAdhanPlaying(false);
  };

  const adjDate = new Date(TODAY);
  adjDate.setDate(adjDate.getDate() + (prefs.hijriAdj||0));
  const hijri   = gToHijri(adjDate.getFullYear(), adjDate.getMonth()+1, adjDate.getDate());
  const dateStr = `${WEEKDAYS[TODAY.getDay()]}, ${TODAY.getDate()} ${GMONTHS[TODAY.getMonth()]} ${TODAY.getFullYear()}`;
  const nowStr  = (()=>{ const t=fmt(nowMin,prefs.is24); return prefs.is24?t.str:`${t.str} ${t.ampm}`; })();

  const go   = (s)=>{ setStack(st=> screen!==s?[...st,screen]:st); setScreen(s); };
  const back = ()=>{ setStack(st=>{ if(!st.length){setScreen('home');return st;} const cp=[...st]; setScreen(cp.pop()); return cp; }); };
  const home = ()=>{ setStack([]); setScreen('home'); };
  const menu = ()=> screen==='menu' ? back() : go('menu');

  const Home = HOMES[variant] || HomeLedger;
  let view;
  switch(screen){
    case 'menu':          view = <ScreenMenu go={go} />; break;
    case 'settings':      view = <ScreenSettings prefs={prefs} setPrefs={setPrefs} go={go} loc={loc} locStatus={locStatus} />; break;
    case 'notifications': view = <ScreenNotifications prefs={prefs} setPrefs={setPrefs} go={go} />; break;
    case 'calendar':      view = <ScreenCalendar go={go} hijriAdj={prefs.hijriAdj} />; break;
    default:              view = <Home times={times} nowMin={nowMin} prefs={prefs} hijri={hijri} dateStr={dateStr} go={go} />;
  }

  // APK mode: no bezel, no status bar — app fills 100vw × 100vh directly
  if(!chrome){
    return (
      <div className="screen app-screen">
        <div className="viewport">{view}</div>
        {adhanPlaying && (
          <div style={{position:'fixed', bottom:0, left:0, right:0, padding:'12px 20px',
            background:'var(--paper)', borderTop:'2px solid var(--ink)', zIndex:1000}}>
            <button onClick={stopAdhan} style={{display:'block', width:'100%',
              padding:'15px 0', fontSize:17, fontWeight:700, letterSpacing:'.04em',
              background:'var(--ink)', color:'var(--paper)', border:'none', borderRadius:4, cursor:'pointer'}}>
              Stop Adhan
            </button>
          </div>
        )}
      </div>
    );
  }

  // Design-preview mode: full KompaktFrame with status bar
  return (
    <KompaktFrame onBack={back} onHome={home} onMenu={menu}>
      <StatusBar nowStr={nowStr} />
      <div className="viewport">{view}</div>
      {adhanPlaying && (
        <div style={{padding:'12px 20px', background:'var(--paper)', borderTop:'2px solid var(--ink)'}}>
          <button onClick={stopAdhan} style={{display:'block', width:'100%',
            padding:'15px 0', fontSize:17, fontWeight:700, letterSpacing:'.04em',
            background:'var(--ink)', color:'var(--paper)', border:'none', borderRadius:4, cursor:'pointer'}}>
            Stop Adhan
          </button>
        </div>
      )}
    </KompaktFrame>
  );
}

Object.assign(window, { KompaktApp });
