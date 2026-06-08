/* ============================================================
   KompaktApp — one full app instance.
   `variant` (a|b|c) selects the HOME direction; all sub-screens
   are shared. Manages nav stack, prefs, and a live demo clock.
   ============================================================ */

const HOMES = { a: HomeLedger, b: HomeCountdown, c: HomeArc, d: HomeArcTimes };

function KompaktApp({ variant='a', chrome=true }){
  const [screen, setScreen] = React.useState('home');
  const [stack, setStack]   = React.useState([]);
  const [prefs, setPrefsRaw] = React.useState({
    method:'isna', madhab:'standard', is24:false, hijriAdj:0,
    adhan:true, sound:'makkah', customAdhan:null, reminder:'5 minutes before',
    notif:{ fajr:true, dhuhr:true, asr:true, maghrib:true, isha:true, sunrise:false },
  });
  const setPrefs = (patch)=> setPrefsRaw(p=>({...p, ...patch}));

  // live demo clock (anchored so the day reads nicely)
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(()=>{ const id=setInterval(()=>setElapsed(e=>e+1), 1000); return ()=>clearInterval(id); }, []);
  const nowMin = DEMO_ANCHOR_MIN + elapsed/60;

  const times = computeTimes(prefs);
  const adjDate = new Date(TODAY); adjDate.setDate(adjDate.getDate() + (prefs.hijriAdj||0));
  const hijri = gToHijri(adjDate.getFullYear(), adjDate.getMonth()+1, adjDate.getDate());
  const dateStr = `${WEEKDAYS[TODAY.getDay()]}, ${TODAY.getDate()} ${GMONTHS[TODAY.getMonth()]} ${TODAY.getFullYear()}`;
  const nowStr = (()=>{ const t=fmt(nowMin, prefs.is24); return prefs.is24? t.str : `${t.str} ${t.ampm}`; })();

  const go = (s)=>{ setStack(st=> screen!==s ? [...st, screen] : st); setScreen(s); };
  const back = ()=>{ setStack(st=>{ if(!st.length){ setScreen('home'); return st; } const cp=[...st]; const prev=cp.pop(); setScreen(prev); return cp; }); };
  const home = ()=>{ setStack([]); setScreen('home'); };
  const menu = ()=> screen==='menu' ? back() : go('menu');

  const Home = HOMES[variant] || HomeLedger;
  let view;
  switch(screen){
    case 'menu':          view = <ScreenMenu go={go} />; break;
    case 'settings':      view = <ScreenSettings prefs={prefs} setPrefs={setPrefs} go={go} />; break;
    case 'notifications': view = <ScreenNotifications prefs={prefs} setPrefs={setPrefs} go={go} />; break;
    case 'calendar':      view = <ScreenCalendar go={go} hijriAdj={prefs.hijriAdj} />; break;
    case 'qibla':         view = <ScreenQibla go={go} />; break;
    default:              view = <Home times={times} nowMin={nowMin} prefs={prefs} hijri={hijri} dateStr={dateStr} go={go} />;
  }

  const screenInner = (
    <React.Fragment>
      <StatusBar nowStr={nowStr} />
      <div className="viewport">{view}</div>
    </React.Fragment>
  );

  if(!chrome){
    // App build: the 480×800 screen fills its container, no bezel / hardware nav.
    return <div className="screen app-screen">{screenInner}</div>;
  }

  return (
    <KompaktFrame onBack={back} onHome={home} onMenu={menu}>
      {screenInner}
    </KompaktFrame>
  );
}

Object.assign(window, { KompaktApp });
