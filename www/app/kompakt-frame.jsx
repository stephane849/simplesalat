/* ============================================================
   Kompakt device frame — white body, black bezel,
   capacitive nav (back / home / menu), privacy switch hint.
   ============================================================ */

function KompaktFrame({ children, onBack, onHome, onMenu, finish='white' }){
  const body = finish === 'black' ? '#1A1915' : '#ECEAE3';
  return (
    <div className="kompakt" style={{'--finish':body}}>
      <div className="priv" />
      <div className="bezel">
        <div className="earpiece">
          <span className="dot" />
          <span className="slit" />
          <span className="dot" />
        </div>
        <div className="screen">
          {children}
        </div>
        <div className="nav">
          <button onClick={onBack} aria-label="Back"><Ico.back/></button>
          <button onClick={onHome} aria-label="Home"><Ico.home/></button>
          <button onClick={onMenu} aria-label="Menu"><Ico.menu/></button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KompaktFrame });
