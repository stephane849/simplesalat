/* ============================================================
   Sub-screens — Menu · Settings · Notifications · Calendar · Qibla
   Shared across all three home directions.
   Props: { prefs, setPrefs, times, nowMin, go }
   ============================================================ */

/* ---------- App menu (hardware menu button) ---------- */
function ScreenMenu({ go }){
  const items = [
    { k:'home',          en:'Prayer Times',  ar:'مواقيت الصلاة' },
    { k:'calendar',      en:'Hijri Calendar', ar:'التقويم الهجري' },
    { k:'notifications', en:'Adhan & Alerts',  ar:'الأذان' },
    { k:'settings',      en:'Settings',        ar:'الإعدادات' },
  ];
  return (
    <div className="view">
      <AppBar title="Menu" onBack={()=>go('home')} />
      <hr className="hrule" />
      <div className="scroll">
        {items.map(it=>(
          <div key={it.k} className="row" onClick={()=>go(it.k)} style={{borderBottom:'1px solid var(--line)'}}>
            <div className="body" style={{display:'flex', alignItems:'baseline', gap:12}}>
              <span className="label" style={{fontSize:19, whiteSpace:'nowrap'}}>{it.en}</span>
              <span className="ar" style={{fontSize:16, color:'var(--ink-mute)'}}>{it.ar}</span>
            </div>
            <span className="trail"><Ico.chev/></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
function ScreenSettings({ prefs, setPrefs, go, loc, locStatus }){
  const mKeys = Object.keys(METHODS);
  const m = METHODS[prefs.method];
  const cycleMethod = ()=>{ const i=mKeys.indexOf(prefs.method); setPrefs({method:mKeys[(i+1)%mKeys.length]}); };
  const a = prefs.hijriAdj || 0;
  const adjLabel = a===0 ? '0 days' : `${a>0?'+':'\u2212'}${Math.abs(a)} day${Math.abs(a)>1?'s':''}`;
  return (
    <div className="view">
      <AppBar title="Settings" onBack={()=>go('home')} onMenu={()=>go('menu')} />
      <hr className="hrule" />
      <div className="scroll">
        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Location</div><div className="sub">{locStatus==='ok'?'GPS':'Auto · GPS'}</div></div>
          <span className="trail"><span className="val" style={{maxWidth:146, textAlign:'right', lineHeight:1.3}}>
            {locStatus==='ok'&&loc ? `${Math.abs(loc.lat).toFixed(2)}°${loc.lat>=0?'N':'S'}, ${Math.abs(loc.lon).toFixed(2)}°${loc.lon>=0?'E':'W'}` : locStatus==='loading' ? 'Locating…' : LOC_DEFAULT.city+' (default)'}
          </span></span>
        </div>

        <div className="row" onClick={cycleMethod} style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Calculation method</div><div className="sub">{m.region} · tap to change</div></div>
          <span className="trail"><span className="val" style={{textAlign:'right', maxWidth:158, lineHeight:1.2}}>{m.label}</span><Ico.chev/></span>
        </div>

        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Asr calculation</div><div className="sub">Shadow length</div></div>
          <span className="trail">
            <div className="seg">
              <button data-on={prefs.madhab==='standard'} onClick={()=>setPrefs({madhab:'standard'})}>Standard</button>
              <button data-on={prefs.madhab==='hanafi'} onClick={()=>setPrefs({madhab:'hanafi'})}>Ḥanafī</button>
            </div>
          </span>
        </div>

        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Time format</div></div>
          <span className="trail">
            <div className="seg">
              <button data-on={!prefs.is24} onClick={()=>setPrefs({is24:false})}>12h</button>
              <button data-on={prefs.is24} onClick={()=>setPrefs({is24:true})}>24h</button>
            </div>
          </span>
        </div>

        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Hijri date</div><div className="sub">Adjust for local moon sighting</div></div>
          <span className="trail" style={{gap:10}}>
            <button className="stepbtn" disabled={a<=-2} onClick={()=>setPrefs({hijriAdj:Math.max(-2,a-1)})} aria-label="Minus a day">−</button>
            <span className="val" style={{minWidth:62, textAlign:'center'}}>{adjLabel}</span>
            <button className="stepbtn" disabled={a>=2} onClick={()=>setPrefs({hijriAdj:Math.min(2,a+1)})} aria-label="Plus a day">+</button>
          </span>
        </div>

        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">High-latitude rule</div><div className="sub">Ottawa, summer</div></div>
          <span className="trail"><span className="val">Angle-based</span></span>
        </div>

        <div className="row" onClick={()=>go('notifications')} style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Adhan &amp; alerts</div></div>
          <span className="trail"><Ico.bell/><Ico.chev/></span>
        </div>

        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">About Salāt</div><div className="sub">For MuditaOS K</div></div>
          <span className="trail"><span className="val">v1.0</span></span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Adhan & Notifications ---------- */
const ADHAN_SRCS = {
  makkah:  'audio/adhan-makkah.mp3',
  madinah: 'audio/adhan-madinah.mp3',
  sudan:   'audio/adhan-sudan.mp3',
};

function ScreenNotifications({ prefs, setPrefs, go }){
  const reminders = ['At adhan','5 minutes before','10 minutes before','15 minutes before'];
  const sounds = [
    {k:'makkah',  label:'Makkah'},
    {k:'madinah', label:'Madīnah'},
    {k:'sudan',   label:'Sudan'},
  ];
  const cyc = (key, arr)=>{ const i=arr.indexOf(prefs[key]); setPrefs({[key]:arr[(i+1)%arr.length]}); };
  const list = PRAYERS.filter(p=>p.prayer);
  const setNotif = (k,v)=> setPrefs({ notif:{...prefs.notif, [k]:v} });

  const [playingKey, setPlayingKey] = React.useState(null);
  const audioRef = React.useRef(null);

  React.useEffect(function(){
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SalatAudio;
    if(!plugin) return;
    var handle = plugin.addListener('playbackComplete', function(){ setPlayingKey(null); });
    return function(){ if(handle && handle.remove) handle.remove(); };
  }, []);

  const stopAll = ()=>{
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SalatAudio;
    if(plugin){ plugin.stop({}); }
    if(audioRef.current){ audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    setPlayingKey(null);
  };

  const previewSound = (e, key)=>{
    e.stopPropagation();
    if(playingKey === key){ stopAll(); return; }
    stopAll();
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SalatAudio;
    if(plugin){
      plugin.play({sound: key}).then(function(){ setPlayingKey(key); }).catch(function(){ setPlayingKey(null); });
      return;
    }
    var audio = new Audio(ADHAN_SRCS[key]);
    audioRef.current = audio;
    audio.onended = function(){ if(audioRef.current === audio) setPlayingKey(null); };
    audio.onerror = function(){ if(audioRef.current === audio) setPlayingKey(null); };
    var result = audio.play();
    if(result !== undefined){
      result.then(function(){ setPlayingKey(key); }).catch(function(){ setPlayingKey(null); });
    } else {
      setPlayingKey(key);
    }
  };

  const Radio = ({on})=>(
    <span style={{width:22, height:22, borderRadius:'50%', border:'1.5px solid var(--ink)',
      flex:'0 0 auto', display:'grid', placeItems:'center'}}>
      {on && <span style={{width:11, height:11, borderRadius:'50%', background:'var(--ink)'}} />}
    </span>
  );
  const dim = prefs.adhan ? {} : { opacity:0.38, pointerEvents:'none' };

  return (
    <div className="view">
      <AppBar title="Adhan & Alerts" onBack={()=>go('settings')} onMenu={()=>go('menu')} />
      <hr className="hrule" />
      <div className="scroll">
        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Adhan sound</div><div className="sub">Play call to prayer</div></div>
          <Toggle on={prefs.adhan} onChange={v=>setPrefs({adhan:v})} />
        </div>

        <div style={{padding:'18px 32px 8px'}} className="kicker">Sound</div>
        <div style={dim}>
          {sounds.map(s=>(
            <div key={s.k} className="row" onClick={()=>setPrefs({sound:s.k})} style={{borderBottom:'1px solid var(--line)'}}>
              <span className="lead"><Radio on={prefs.sound===s.k} /></span>
              <div className="body"><div className="label">{s.label}</div></div>
              <span className="trail">
                <button className="appbar iconbtn" style={{padding:8, border:'1.5px solid var(--ink)', borderRadius:'50%'}}
                  onClick={(e)=>previewSound(e, s.k)} aria-label="Preview">
                  {playingKey===s.k ? <Ico.pause/> : <Ico.play/>}
                </button>
              </span>
            </div>
          ))}
        </div>

        <div style={{padding:'18px 32px 8px'}} className="kicker">Timing</div>
        <div className="row" onClick={()=>cyc('reminder', reminders)} style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label">Reminder</div></div>
          <span className="trail"><span className="val">{prefs.reminder}</span><Ico.chev/></span>
        </div>

        <div style={{padding:'18px 32px 8px'}} className="kicker">Per prayer</div>
        {list.map(p=>(
          <div key={p.key} className="row" style={{borderBottom:'1px solid var(--line)'}}>
            <div className="body" style={{display:'flex', alignItems:'baseline', gap:10}}>
              <span className="label">{p.en}</span>
              <span className="ar" style={{fontSize:15, color:'var(--ink-mute)'}}>{p.ar}</span>
            </div>
            <Toggle on={prefs.notif[p.key]} onChange={v=>setNotif(p.key, v)} />
          </div>
        ))}
        <div className="row" style={{borderBottom:'1px solid var(--line)'}}>
          <div className="body"><div className="label" style={{color:'var(--ink-soft)'}}>Sunrise</div><div className="sub">Shurūq reminder</div></div>
          <Toggle on={prefs.notif.sunrise} onChange={v=>setNotif('sunrise', v)} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Hijri Calendar ---------- */
function ScreenCalendar({ go, hijriAdj=0 }){
  const HJ = (gy, gm1, gd)=>{ const dt=new Date(gy, gm1-1, gd); if(hijriAdj) dt.setDate(dt.getDate()+hijriAdj);
    return gToHijri(dt.getFullYear(), dt.getMonth()+1, dt.getDate()); };
  const [view, setView] = React.useState({ y:TODAY.getFullYear(), m:TODAY.getMonth() });
  const first = new Date(view.y, view.m, 1).getDay();
  const days  = new Date(view.y, view.m+1, 0).getDate();
  const mid   = HJ(view.y, view.m+1, 15);
  const cells = [];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1; d<=days; d++) cells.push(d);
  while(cells.length % 7) cells.push(null);
  const isToday = (d)=> d && view.y===TODAY.getFullYear() && view.m===TODAY.getMonth() && d===TODAY.getDate();
  const move = (dir)=> setView(v=>{ let m=v.m+dir, y=v.y; if(m<0){m=11;y--;} if(m>11){m=0;y++;} return {y,m}; });
  const th = HJ(TODAY.getFullYear(), TODAY.getMonth()+1, TODAY.getDate());

  return (
    <div className="view">
      <AppBar title="Calendar" onBack={()=>go('home')} onMenu={()=>go('menu')} />
      <hr className="hrule" />
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px 10px'}}>
        <button className="appbar iconbtn" style={{padding:6}} onClick={()=>move(-1)}><Ico.left/></button>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:19, fontWeight:600}}>{HIJRI_MONTHS[mid.m]} {mid.y}</div>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:2}}>{GMONTHS[view.m]} {view.y}</div>
        </div>
        <button className="appbar iconbtn" style={{padding:6}} onClick={()=>move(1)}><Ico.right/></button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 20px 6px'}}>
        {WEEKDAYS_S.map((w,i)=>(
          <div key={i} style={{textAlign:'center', fontSize:11, letterSpacing:'.08em', fontWeight:600,
            color: i===5?'var(--ink-soft)':'var(--ink-mute)', padding:'4px 0'}}>{w}</div>
        ))}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 20px', gap:'2px 0'}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i} />;
          const hj = HJ(view.y, view.m+1, d);
          const today = isToday(d);
          const fri = (i%7)===5;
          return (
            <div key={i} style={{height:58, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', position:'relative'}}>
              <div style={{
                width:38, height:38, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                borderRadius:'50%',
                background: today?'var(--ink)':'transparent',
                color: today?'var(--paper)':(fri?'var(--ink)':'var(--ink-soft)'),
              }}>
                <span className="tnum" style={{fontSize:16, fontWeight: today?700:500, lineHeight:1}}>{hj.d}</span>
                <span className="tnum" style={{fontSize:9.5, opacity:.7, marginTop:1}}>{d}</span>
              </div>
            </div>
          );
        })}
      </div>
      <hr className="hrule" style={{margin:'10px 0 0'}}/>
      <div className="scr-pad" style={{paddingTop:16}}>
        <div className="kicker" style={{marginBottom:8}}>Today</div>
        <div style={{fontSize:17, fontWeight:600}}>{th.d} {HIJRI_MONTHS[th.m]} {th.y} AH</div>
        <div style={{fontSize:13.5, color:'var(--ink-mute)', marginTop:3}}>
          {WEEKDAYS[TODAY.getDay()]}, {TODAY.getDate()} {GMONTHS[TODAY.getMonth()]} {TODAY.getFullYear()}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenMenu, ScreenSettings, ScreenNotifications, ScreenCalendar });
