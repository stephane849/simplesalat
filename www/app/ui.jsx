/* ============================================================
   Shared UI primitives + minimal line icons (1.75px stroke)
   ============================================================ */

/* ---- icons ---- */
const Ico = {
  back: (p)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  home: (p)=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2"/></svg>),
  menu: (p)=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  chev: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  bell: (p)=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M6 9a6 6 0 1112 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  left: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  right: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  check: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  play: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M7 5l12 7-12 7V5z" fill="currentColor"/></svg>),
  pause: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>),
  close: (p)=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  upload: (p)=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M12 16V5M8 9l4-4 4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 15v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>),
};

/* ---- status bar (in-screen OS chrome) ---- */
function StatusBar({ nowStr }){
  return (
    <div className="statusbar">
      <span className="tnum" style={{fontWeight:500}}>{nowStr}</span>
      <span className="right">
        <span style={{fontSize:12, letterSpacing:'.04em'}}>LTE</span>
        <span className="batt"><span className="cell"><span className="fill"></span></span></span>
      </span>
    </div>
  );
}

/* ---- top app bar ---- */
function AppBar({ title, onMenu, onBack }){
  return (
    <div className="appbar">
      {onBack
        ? <button className="iconbtn" onClick={onBack} aria-label="Back"><Ico.left/></button>
        : <span style={{width:18}} />}
      <span className="title">{title}</span>
      {onMenu
        ? <button className="iconbtn" onClick={onMenu} aria-label="Menu"><Ico.menu/></button>
        : <span style={{width:22}} />}
    </div>
  );
}

/* ---- radio button ---- */
function Radio({ on }){
  return (
    <span style={{width:22, height:22, borderRadius:'50%', border:'2px solid var(--ink)',
      flex:'0 0 auto', display:'grid', placeItems:'center'}}>
      {on && <span style={{width:11, height:11, borderRadius:'50%', background:'var(--ink)'}} />}
    </span>
  );
}

/* ---- toggle ---- */
function Toggle({ on, onChange }){
  return (
    <button className="tgl" data-on={on} aria-pressed={on}
      onClick={(e)=>{ e.stopPropagation(); onChange(!on); }}>
      <span className="knob" />
    </button>
  );
}

/* ---- a time, English clock + small am/pm, tabular ---- */
function Clock({ min, is24, size=20, weight=500, mute=false }){
  const t = fmt(min, is24);
  return (
    <span className="tnum" style={{fontWeight:weight, color: mute?'var(--ink-mute)':'inherit',
      display:'inline-flex', alignItems:'baseline', gap:4, fontSize:size, letterSpacing:'-.01em'}}>
      {t.str}
      {!is24 && <span style={{fontSize:size*0.5, fontWeight:600, color:'var(--ink-mute)', letterSpacing:'.04em'}}>{t.ampm}</span>}
    </span>
  );
}

Object.assign(window, { Ico, StatusBar, AppBar, Toggle, Clock, Radio });
