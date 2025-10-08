// render-cache.js - Cache de sprites desenhados em offscreen canvas para evitar recriar gradientes por frame.
// Fornece getTowerSprite(tipo) e getEnemySprite(tipo, raio) que retornam um canvas pronto para drawImage.

const towerCache = new Map();
const enemyCache = new Map(); // key: tipo|raio

function makeCanvas(w,h){ const c = document.createElement('canvas'); c.width=w; c.height=h; return c; }

export function getTowerSprite(tipo){
  if (towerCache.has(tipo)) return towerCache.get(tipo);
  let size=30, gradStops; let shape='rect'; let extra={};
  if (tipo==='basica'){ size=30; gradStops=[['#3b82f6',0], ['#1e3a8a',1]]; }
  else if (tipo==='forte'){ size=36; gradStops=[['#8b5cf6',0], ['#4c1d95',1]]; }
  else if (tipo==='gelo'){ size=32; gradStops=[['#7dd3fc',0], ['#0369a1',1]]; }
  else if (tipo==='eletrica'){ size=40; gradStops=[['#f97316',0], ['#f59e0b',1]]; shape='bolt'; }
  const c = makeCanvas(size,size); const ctx = c.getContext('2d');
  if (shape==='rect'){
    const g = ctx.createLinearGradient(0,0,size,size); gradStops.forEach(([col,pos])=>g.addColorStop(pos,col));
    ctx.fillStyle=g; ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=Math.floor(size*0.25);
    ctx.fillRect(0,0,size,size); ctx.shadowBlur=0;
  } else if (shape==='bolt'){
    const g = ctx.createLinearGradient(0,0,size,size); gradStops.forEach(([col,pos])=>g.addColorStop(pos,col));
    ctx.fillStyle=g; ctx.shadowColor='rgba(249,115,22,0.4)'; ctx.shadowBlur=10;
    const cx=size/2; const cy=size/2; ctx.beginPath();
    ctx.moveTo(cx-10, cy-14); ctx.lineTo(cx+12, cy-2); ctx.lineTo(cx-4, cy+14); ctx.lineTo(cx+10, cy+14); ctx.lineTo(cx-6, cy-2); ctx.lineTo(cx+8, cy-14); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
  }
  towerCache.set(tipo,c); return c;
}

export function getEnemySprite(tipo, raio){
  const key = tipo+'|'+raio;
  if (enemyCache.has(key)) return enemyCache.get(key);
  let outer='#FF0000', inner='#ff7b7b';
  if (tipo==='gelo'){ outer='#7ec8ff'; inner='#cfeeff'; }
  else if (tipo==='forte'){ outer='#7f0000'; inner='#ffb3b3'; }
  else if (tipo==='boss'){ outer='#4b0082'; inner='#c084fc'; }
  const size = raio*2 + 8; // margem para glow
  const c = makeCanvas(size,size); const ctx = c.getContext('2d');
  const cx=size/2; const cy=size/2; const g = ctx.createRadialGradient(cx - raio/3, cy - raio/3, 1, cx, cy, raio);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,raio,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=2; ctx.stroke();
  enemyCache.set(key,c); return c;
}

export function renderCacheDebug(){
  return {
    towers: [...towerCache.keys()],
    enemies: [...enemyCache.keys()],
    counts: { towers: towerCache.size, enemies: enemyCache.size }
  };
}
