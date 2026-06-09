/* ============================================================
   Three HOME directions — vary hierarchy, type scale, metaphor.
   A · Ledger   B · Countdown   C · Arc of the day
   Props: { times, nowMin, prefs, hijri, dateStr }
   ============================================================ */

function HomeHeader({ hijri, dateStr, compact }){
  const hj = `${hijri.d} ${HIJRI_MONTHS[hijri.m]} ${hijri.y}`;
  if(compact){
    return (
      <div style={{textAlign:'center', padding:'18px 24px 4px'}}>
        <div style={{fontSize:13, letterSpacing:'.04em', color:'var(--ink-soft)'}}>{LOC_DEFAULT.city}</div>
        <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:3}}>{hj} · {dateStr}</div>
      </div>
    );
  }
  return (
    <div className="scr-pad" style={{paddingBottom:18}}>
      <div className="kicker" style={{marginBottom:10}}>{LOC_DEFAULT.city}</div>
      <div style={{fontSize:25, fontWeight:600, letterSpacing:'-.01em', lineHeight:1.1}}>{hijri.d} {HIJRI_MONTHS[hijri.m]}</div>
      <div style={{fontSize:14, color:'var(--ink-mute)', marginTop:5}}>{hijri.y} AH · {dateStr}</div>
    </div>
  );
}

/* ---------- in-app menu button (home screens) ---------- */
function HomeMenuButton({ go }){
  if(!go) return null;
  return (
    <button onClick={()=>go('menu')} aria-label="Open menu"
      style={{position:'absolute', top:6, right:12, zIndex:5, padding:8, background:'transparent',
        border:0, cursor:'pointer', color:'var(--ink)', display:'grid', placeItems:'center', borderRadius:8}}>
      <Ico.menu/>
    </button>
  );
}

/* ---------- A · LEDGER — list-led, editorial ---------- */
function HomeLedger({ times, nowMin, prefs, hijri, dateStr, go }){
  const nk = nextPrayer(times, nowMin).key;
  const next = PRAYERS.find(p=>p.key===nk);
  const cd = countdown(times[nk], nowMin);
  return (
    <div className="view">
      <HomeMenuButton go={go} />
      <HomeHeader hijri={hijri} dateStr={dateStr} />
      <hr className="hrule strong" />
      <div className="scr-pad" style={{paddingTop:20, paddingBottom:20}}>
        <div className="kicker" style={{marginBottom:10}}>Next prayer</div>
        <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12}}>
          <div style={{display:'flex', alignItems:'baseline', gap:12}}>
            <span style={{fontSize:42, fontWeight:600, letterSpacing:'-.02em', lineHeight:1}}>{next.en}</span>
            <span className="ar" style={{fontSize:30, color:'var(--ink-soft)'}}>{next.ar}</span>
          </div>
        </div>
        <div style={{fontSize:16, color:'var(--ink-soft)', marginTop:12, display:'flex', alignItems:'baseline', gap:8}}>
          <Clock min={times[nk]} is24={prefs.is24} size={16} weight={600}/>
          <span style={{color:'var(--ink-mute)'}}>· in {cd.long}</span>
        </div>
      </div>
      <hr className="hrule strong" />
      <div className="scroll">
        {PRAYERS.map((p)=>{
          const active = p.key===nk;
          const past = times[p.key] < nowMin && !active;
          return (
            <div key={p.key} style={{
              display:'flex', alignItems:'center', padding:'0 32px',
              height: p.prayer ? 66 : 52,
              borderBottom:'1px solid var(--line)',
              opacity: past ? .42 : 1,
              background: active ? 'var(--paper-2)' : 'transparent',
            }}>
              <span style={{width:16, flex:'0 0 auto'}}>
                {active && <span style={{display:'inline-block', width:8, height:8, background:'var(--ink)'}} />}
              </span>
              <div style={{flex:'1 1 auto', display:'flex', alignItems:'baseline', gap:10}}>
                <span style={{fontSize: p.prayer?20:16, fontWeight: active?700:(p.prayer?500:400),
                  fontStyle: p.prayer?'normal':'italic', color: p.prayer?'var(--ink)':'var(--ink-soft)'}}>{p.en}</span>
                <span className="ar" style={{fontSize: p.prayer?17:14, color:'var(--ink-mute)'}}>{p.ar}</span>
              </div>
              <Clock min={times[p.key]} is24={prefs.is24} size={p.prayer?19:16}
                weight={active?700:500} mute={!p.prayer}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- B · COUNTDOWN — giant remaining-time hero ---------- */
function HomeCountdown({ times, nowMin, prefs, hijri, dateStr, go }){
  const nk = nextPrayer(times, nowMin).key;
  const next = PRAYERS.find(p=>p.key===nk);
  const cd = countdown(times[nk], nowMin);
  // progress between previous marker and next
  const ordered = PRAYERS.map(p=>({...p, t:times[p.key]}));
  const prevs = ordered.filter(p=>p.t<=nowMin);
  const prevT = prevs.length ? prevs[prevs.length-1].t : ordered[0].t;
  const frac = Math.max(0, Math.min(1, (nowMin - prevT) / (times[nk] - prevT)));
  return (
    <div className="view">
      <HomeMenuButton go={go} />
      <HomeHeader hijri={hijri} dateStr={dateStr} compact />
      <div style={{flex:'1 1 auto', display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'8px 32px'}}>
        <div className="kicker" style={{marginBottom:18}}>Until {next.en}</div>
        <div style={{display:'flex', alignItems:'baseline', gap:14, lineHeight:.86}}>
          <span className="tnum" style={{fontSize: cd.h>0?128:148, fontWeight:600, letterSpacing:'-.05em'}}>{cd.clock}</span>
          <span style={{fontSize:24, fontWeight:600, color:'var(--ink-mute)'}}>{cd.h>0?'hrs':'min'}</span>
        </div>
        <div className="ar" style={{fontSize:40, color:'var(--ink)', marginTop:18}}>{next.ar}</div>
        <div style={{marginTop:6, display:'flex', alignItems:'baseline', gap:10}}>
          <span style={{fontSize:19, fontWeight:600}}>{next.en}</span>
          <span style={{color:'var(--ink-mute)'}}>at</span>
          <Clock min={times[nk]} is24={prefs.is24} size={19} weight={600}/>
        </div>
        {/* progress */}
        <div style={{width:'78%', marginTop:34, display:'flex', alignItems:'center', gap:0}}>
          <div style={{flex:1, height:2, background:'var(--line-2)', position:'relative'}}>
            <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${frac*100}%`, background:'var(--ink)'}} />
            <div style={{position:'absolute', left:`calc(${frac*100}% - 5px)`, top:-4, width:10, height:10,
              borderRadius:'50%', background:'var(--ink)'}} />
          </div>
        </div>
      </div>
      <hr className="hrule" />
      <div style={{flex:'0 0 auto', padding:'4px 0 10px'}}>
        {PRAYERS.filter(p=>p.prayer).map(p=>{
          const active=p.key===nk, past=times[p.key]<nowMin && !active;
          return (
            <div key={p.key} style={{display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'0 32px', height:46, opacity:past?0.4:1, fontWeight:active?700:400}}>
              <span style={{fontSize:15.5, letterSpacing:'.01em'}}>{p.en}</span>
              <Clock min={times[p.key]} is24={prefs.is24} size={15.5} weight={active?700:500}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- shared sun-path arc (used by C and D) ---------- */
function DayArc({ times, nowMin, size='full', focusKey=null, onSelect=null }){
  const compact = size === 'compact';
  // Full arc: wider, taller, bigger labels so prayer names are easy to read
  const W=480, padL=26, padR=26, uW=W-padL-padR;
  const apexY = compact?38:42, baseY = compact?196:272, amp=baseY-apexY;
  const vbH = compact?214:294;
  const span = times.isha - times.fajr;
  const fx = (t)=> padL + ((t - times.fajr)/span)*uW;
  const fy = (t)=>{ const f=(t-times.fajr)/span; return apexY + amp*Math.pow(2*f-1,2); };
  const fnow = Math.max(times.fajr, Math.min(times.isha, nowMin));
  const path = (a,b)=>{ let s=''; const N=64;
    for(let i=0;i<=N;i++){ const t=a+(b-a)*i/N; s += (i?'L':'M')+fx(t).toFixed(1)+' '+fy(t).toFixed(1)+' '; }
    return s; };
  const horY = fy(times.sunrise);
  const labelFor = (p)=>{
    const x=fx(times[p.key]), y=fy(times[p.key]);
    const top = y < (apexY+baseY)/2;
    const anchor = x < padL+50 ? 'start' : x > W-padR-50 ? 'end' : 'middle';
    return { x, y, ly: top ? y-15 : y+21, anchor };
  };
  const fontSize = compact ? 12 : 14;
  const focSize  = compact ? 13 : 15;
  return (
    <svg viewBox={`0 0 ${W} ${vbH}`} width="100%" style={{display:'block', overflow:'visible'}}>
      <line x1={padL-4} y1={horY} x2={W-padR+4} y2={horY} stroke="var(--line-2)" strokeWidth="1" strokeDasharray="2 4"/>
      <path d={path(times.fajr, times.isha)} fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="2 5"/>
      <path d={path(times.fajr, fnow)} fill="none" stroke="var(--ink)" strokeWidth="2.5"/>
      {PRAYERS.map(p=>{
        const x=fx(times[p.key]), y=fy(times[p.key]); const past = times[p.key] < nowMin;
        return <circle key={p.key} cx={x} cy={y} r={p.prayer?4.5:3}
          fill={past?'var(--ink)':'var(--paper)'} stroke="var(--ink)" strokeWidth="1.75"/>;
      })}
      <g>
        <circle cx={fx(fnow)} cy={fy(fnow)} r="8" fill="var(--ink)"/>
        {[0,45,90,135,180,225,270,315].map(a=>{ const r=a*Math.PI/180, x=fx(fnow), y=fy(fnow);
          return <line key={a} x1={x+Math.cos(r)*11} y1={y+Math.sin(r)*11}
            x2={x+Math.cos(r)*15} y2={y+Math.sin(r)*15} stroke="var(--ink)" strokeWidth="1.75" strokeLinecap="round"/>; })}
      </g>
      {PRAYERS.map(p=>{ const L=labelFor(p); const foc = p.key===focusKey;
        const clickable = p.prayer && !!onSelect;
        const charW = foc ? focSize*0.62 : fontSize*0.62;
        const w = Math.max(40, p.en.length*charW);
        const rx = L.anchor==='middle' ? L.x-w/2 : L.anchor==='end' ? L.x-w : L.x;
        return (
          <g key={p.key} onClick={clickable?()=>onSelect(p.key):undefined} style={{cursor:clickable?'pointer':'default'}}>
            {clickable && <rect x={rx} y={L.ly-focSize-2} width={w} height={focSize+10} fill="transparent"/>}
            <text x={L.x} y={L.ly} textAnchor={L.anchor}
              fontFamily="var(--sans)" fontSize={foc?focSize:fontSize} fontWeight={foc?700:(p.prayer?600:400)}
              fill={foc?'var(--ink)':(p.prayer?'var(--ink-soft)':'var(--ink-mute)')} style={{letterSpacing:'.01em'}}>{p.en}</text>
          </g>
        ); })}
    </svg>
  );
}

/* ---------- C · ARC OF THE DAY — sun-path metaphor + tap-to-select ---------- */
function HomeArc({ times, nowMin, prefs, hijri, dateStr, go }){
  const dailies = PRAYERS.filter(p=>p.prayer);
  const liveNextKey = nextPrayer(times, nowMin).key;
  const liveIdx = Math.max(0, dailies.findIndex(p=>p.key===liveNextKey));
  const [idx, setIdx] = React.useState(liveIdx);
  const sel = dailies[idx];
  const selMin = times[sel.key];
  const isLive = idx === liveIdx;

  const hm = (x)=>{ const h=Math.floor(x/60), m=Math.floor(x%60); return h?`${h}h ${String(m).padStart(2,'0')}m`:`${m} min`; };
  let d = selMin - nowMin;
  if(d < -720) d += 1440;
  let rel; if(Math.abs(d) < 1) rel='now'; else if(d > 0) rel='in '+hm(d); else rel=hm(-d)+' ago';

  return (
    <div className="view">
      <HomeMenuButton go={go} />
      <HomeHeader hijri={hijri} dateStr={dateStr} compact />
      <div style={{padding:'4px 0 0'}}>
        <DayArc times={times} nowMin={nowMin} size="full" focusKey={sel.key}
          onSelect={(k)=>setIdx(dailies.findIndex(p=>p.key===k))} />
      </div>
      <hr className="hrule" style={{margin:'8px 0 0'}}/>
      <div className="scr-pad" style={{paddingTop:18, flex:'1 1 auto', display:'flex', flexDirection:'column', justifyContent:'center'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
          <span className="kicker">{isLive ? 'Next prayer' : 'Selected prayer'}</span>
          {!isLive && (
            <button className="nowbtn" onClick={()=>setIdx(liveIdx)}><span className="dot" />Now</button>
          )}
        </div>
        <div style={{display:'flex', alignItems:'baseline', gap:12}}>
          <span style={{fontSize:44, fontWeight:600, letterSpacing:'-.02em', lineHeight:1}}>{sel.en}</span>
          <span className="ar" style={{fontSize:30, color:'var(--ink-soft)'}}>{sel.ar}</span>
        </div>
        <div style={{marginTop:12, display:'flex', alignItems:'baseline', gap:9, fontSize:16}}>
          <Clock min={selMin} is24={prefs.is24} size={17} weight={600}/>
          <span style={{color:'var(--ink-mute)'}}>· {rel}</span>
        </div>
        <div style={{marginTop:18, fontSize:12.5, color:'var(--ink-mute)', letterSpacing:'.01em'}}>
          Tap a prayer name on the arc to see its time.
        </div>
      </div>
    </div>
  );
}

/* ---------- D · ARC + TIMES — arc metaphor over the full day list ---------- */
function HomeArcTimes({ times, nowMin, prefs, hijri, dateStr, go }){
  const nk = nextPrayer(times, nowMin).key;
  const next = PRAYERS.find(p=>p.key===nk);
  const cd = countdown(times[nk], nowMin);
  return (
    <div className="view">
      <HomeMenuButton go={go} />
      <HomeHeader hijri={hijri} dateStr={dateStr} compact />
      <div style={{padding:'2px 32px 0'}}>
        <DayArc times={times} nowMin={nowMin} size="compact" />
      </div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 32px 14px'}}>
        <div style={{display:'flex', alignItems:'baseline', gap:9}}>
          <span className="kicker">Next</span>
          <span style={{fontSize:22, fontWeight:600, letterSpacing:'-.01em'}}>{next.en}</span>
          <span className="ar" style={{fontSize:17, color:'var(--ink-mute)'}}>{next.ar}</span>
        </div>
        <span style={{fontSize:14, color:'var(--ink-soft)', whiteSpace:'nowrap', flex:'0 0 auto', paddingLeft:10}}>in {cd.long}</span>
      </div>
      <hr className="hrule strong" />
      <div className="scroll">
        {PRAYERS.map(p=>{
          const active = p.key===nk;
          const past = times[p.key] < nowMin && !active;
          return (
            <div key={p.key} style={{
              display:'flex', alignItems:'center', padding:'0 32px',
              height: p.prayer ? 56 : 46, borderBottom:'1px solid var(--line)',
              opacity: past ? .42 : 1, background: active ? 'var(--paper-2)' : 'transparent',
            }}>
              <span style={{width:16, flex:'0 0 auto'}}>
                {active && <span style={{display:'inline-block', width:8, height:8, background:'var(--ink)'}} />}
              </span>
              <div style={{flex:'1 1 auto', display:'flex', alignItems:'baseline', gap:10}}>
                <span style={{fontSize: p.prayer?18:15, fontWeight: active?700:(p.prayer?500:400),
                  fontStyle: p.prayer?'normal':'italic', color: p.prayer?'var(--ink)':'var(--ink-soft)'}}>{p.en}</span>
                <span className="ar" style={{fontSize: p.prayer?16:13, color:'var(--ink-mute)'}}>{p.ar}</span>
              </div>
              <Clock min={times[p.key]} is24={prefs.is24} size={p.prayer?18:15}
                weight={active?700:500} mute={!p.prayer}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { HomeHeader, HomeLedger, HomeCountdown, HomeArc, HomeArcTimes, DayArc });
