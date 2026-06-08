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
    { k:'qibla',         en:'Qibla',          ar:'القبلة' },
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
function ScreenSettings({ prefs, setPrefs, go, locStr=QIBLA.city }){
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
          <div className="body"><div className="label">Location</div><div className="sub">Auto · GPS</div></div>
          <span className="trail"><span className="val">{locStr}</span></span>
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
function ScreenNotifications({ prefs, setPrefs, go }){
  const reminders = ['At adhan','5 minutes before','10 minutes before','15 minutes before'];
  const sounds = [{k:'makkah',label:'Makkah'},{k:'madinah',label:'Madīnah'},{k:'chime',label:'Soft chime'}];
  const cyc = (key, arr)=>{ const i=arr.indexOf(prefs[key]); setPrefs({[key]:arr[(i+1)%arr.length]}); };
  const list = PRAYERS.filter(p=>p.prayer);
  const setNotif = (k,v)=> setPrefs({ notif:{...prefs.notif, [k]:v} });

  const fileRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);

  const onFile = (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    if(prefs.customAdhan && prefs.customAdhan.url) URL.revokeObjectURL(prefs.customAdhan.url);
    const url = URL.createObjectURL(f);
    setPrefs({ customAdhan:{ name:f.name, url }, sound:'custom', adhan:true });
    setPlaying(false);
  };
  const togglePlay = (e)=>{
    e.stopPropagation();
    const a = audioRef.current; if(!a) return;
    if(playing){ a.pause(); setPlaying(false); }
    else { a.currentTime = 0; a.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false)); }
  };
  const removeCustom = (e)=>{
    e.stopPropagation();
    if(prefs.customAdhan && prefs.customAdhan.url) URL.revokeObjectURL(prefs.customAdhan.url);
    if(audioRef.current){ audioRef.current.pause(); }
    setPlaying(false);
    setPrefs({ customAdhan:null, sound: prefs.sound==='custom' ? 'makkah' : prefs.sound });
  };

  const Radio = ({on})=>(
    <span style={{width:22, height:22, borderRadius:'50%', border:'1.5px solid var(--ink)',
      flex:'0 0 auto', display:'grid', placeItems:'center'}}>
      {on && <span style={{width:11, height:11, borderRadius:'50%', background:'var(--ink)'}} />}
    </span>
  );
  const dim = prefs.adhan ? {} : { opacity:.38, pointerEvents:'none' };

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
            </div>
          ))}

          {prefs.customAdhan && (
            <div className="row" onClick={()=>setPrefs({sound:'custom'})} style={{borderBottom:'1px solid var(--line)'}}>
              <span className="lead"><Radio on={prefs.sound==='custom'} /></span>
              <div className="body" style={{minWidth:0}}>
                <div className="label" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{prefs.customAdhan.name}</div>
                <div className="sub">Your file</div>
              </div>
              <span className="trail" style={{gap:6}}>
                <button className="appbar iconbtn" style={{padding:8, border:'1.5px solid var(--ink)', borderRadius:'50%'}}
                  onClick={togglePlay} aria-label="Preview">{playing ? <Ico.pause/> : <Ico.play/>}</button>
                <button className="appbar iconbtn" style={{padding:8, color:'var(--ink-mute)'}}
                  onClick={removeCustom} aria-label="Remove"><Ico.close/></button>
              </span>
            </div>
          )}

          <div className="row" onClick={()=>fileRef.current && fileRef.current.click()} style={{borderBottom:'1px solid var(--line)'}}>
            <span className="lead" style={{width:22, display:'grid', placeItems:'center', color:'var(--ink-soft)'}}><Ico.upload/></span>
            <div className="body"><div className="label">{prefs.customAdhan ? 'Replace custom adhan…' : 'Upload custom adhan…'}</div>
              <div className="sub">MP3, WAV or OGG audio</div></div>
          </div>
          <input ref={fileRef} type="file" accept="audio/*" style={{display:'none'}} onChange={onFile} />
          <audio ref={audioRef} src={prefs.customAdhan ? prefs.customAdhan.url : undefined}
            onEnded={()=>setPlaying(false)} />
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

/* ---------- Qibla ---------- */
function ScreenQibla({ go, qibla=QIBLA }){
  const C=160, R=128, b=qibla.bearing;
  const rad=(deg)=> (deg-90)*Math.PI/180;
  const pt=(deg,r)=>[C+Math.cos((deg-90)*Math.PI/180)*r, C+Math.sin((deg-90)*Math.PI/180)*r];
  const tip=pt(b, R-26);
  const baseL=pt(b-90, 13), baseR=pt(b+90, 13);
  const tail=pt(b+180, 40);
  const card=[['N',0],['E',90],['S',180],['W',270]];
  return (
    <div className="view">
      <AppBar title="Qibla" onBack={()=>go('home')} onMenu={()=>go('menu')} />
      <hr className="hrule" />
      <div style={{flex:'1 1 auto', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6}}>
        <svg viewBox="0 0 320 320" width="300" height="300">
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line-2)" strokeWidth="1.5"/>
          <circle cx={C} cy={C} r={R-20} fill="none" stroke="var(--line)" strokeWidth="1"/>
          {/* degree ticks every 30 */}
          {Array.from({length:12}).map((_,i)=>{ const a=i*30; const o=pt(a,R), inn=pt(a,R-(a%90===0?14:8));
            return <line key={i} x1={o[0]} y1={o[1]} x2={inn[0]} y2={inn[1]} stroke="var(--ink-soft)" strokeWidth={a%90===0?2:1}/>; })}
          {/* cardinal labels */}
          {card.map(([l,a])=>{ const p=pt(a,R-34);
            return <text key={l} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--sans)" fontSize="15" fontWeight={l==='N'?700:500}
              fill={l==='N'?'var(--ink)':'var(--ink-mute)'}>{l}</text>; })}
          {/* qibla needle */}
          <line x1={C} y1={C} x2={tail[0]} y2={tail[1]} stroke="var(--ink-mute)" strokeWidth="2" strokeLinecap="round"/>
          <polygon points={`${tip[0]},${tip[1]} ${baseL[0]},${baseL[1]} ${baseR[0]},${baseR[1]}`} fill="var(--ink)"/>
          {/* kaaba marker (square) at tip */}
          <rect x={tip[0]-7} y={tip[1]-7} width="14" height="14" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2"
            transform={`rotate(${b} ${tip[0]} ${tip[1]})`}/>
          <circle cx={C} cy={C} r="4" fill="var(--ink)"/>
        </svg>
        <div style={{textAlign:'center', marginTop:6}}>
          <div className="tnum" style={{fontSize:34, fontWeight:600, letterSpacing:'-.01em'}}>{b}° <span style={{fontSize:18, color:'var(--ink-mute)', fontWeight:500}}>{qibla.label}</span></div>
          <div style={{fontSize:14, color:'var(--ink-soft)', marginTop:4}}>{qibla.distanceKm.toLocaleString()} km to Makkah</div>
        </div>
      </div>
      <div className="scr-pad" style={{paddingTop:0}}>
        <hr className="hrule" style={{marginBottom:14}}/>
        <div style={{fontSize:13.5, color:'var(--ink-mute)', textAlign:'center', lineHeight:1.5}}>
          Hold the phone flat and turn until the marker points up.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenMenu, ScreenSettings, ScreenNotifications, ScreenCalendar, ScreenQibla });
