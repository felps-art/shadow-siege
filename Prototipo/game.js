// game.js - Orquestra o estado principal, loop e integra módulos
import { levels, clonePath } from './levels.js';
import { Torre, TorreForte, TorreGelo, TorreEletrica, Inimigo, Projetil, updateParticles, projectilePool, particlePool } from './entities.js';
import { getElements, updateHUD, tooltipShow, tooltipHide, unlockNextLevelIfAny, showVictory, hideVictory, openLevelSelector, closeLevelSelector } from './ui.js';
import { CONFIG, tooltipFromTowerKey } from './config.js';
import { PersistenceService } from './persistence-service.js';
import { AudioService } from './audio-service.js';
import { TooltipService } from './tooltip-service.js';
import { events } from './event-bus.js';
import { WaveManager } from './wave-manager.js';
import { precomputePath } from './path-utils.js';
import { renderCacheDebug } from './render-cache.js';
import { SpatialHash } from './spatial-index.js';

// Estado principal
const state = {
  dinheiro: 0,
  vidas: 20,
  numeroOnda: 0,
  inimigosAtivos: 0,
  jogoAcabou: false,
  gameStarted: false,
  bossAlive: false,
  tipoTorreSelecionada: 'basica',
  sellMode: false,
  caminho: [],
  pathInfo: null,
  spatial: new SpatialHash(80),
  currentLevelIndex: 0,
  wavesLaunchedThisLevel: 0,
  torres: [],
  inimigos: [],
  projeteis: [],
  particles: [],
  pendingBuild: null,
  isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints>0)
};

const REWARD_MULT = CONFIG.ECONOMY.REWARD_MULT;

const elements = getElements();
const canvas = elements.canvas; const ctx = canvas.getContext('2d');
let services = {};

// Lista de stats para tooltips
const stats = CONFIG.TOWERS; // para compatibilidade com tooltipHTML

function loadLevel(index){
  if (index < 0 || index >= levels.length) return;
  state.currentLevelIndex = index;
  const lvl = levels[index];
  state.caminho = clonePath(lvl.caminho);
  state.pathInfo = precomputePath(state.caminho);
  // Offscreen canvas para caminho estático
  state.pathCanvas = document.createElement('canvas'); state.pathCanvas.width = canvas.width; state.pathCanvas.height = canvas.height;
  const pctx = state.pathCanvas.getContext('2d');
  const caminho = state.caminho; if (caminho.length){
    pctx.strokeStyle='#8B5A2B'; pctx.lineWidth=40; pctx.lineCap='round'; pctx.beginPath(); pctx.moveTo(caminho[0].x,caminho[0].y); for(let i=1;i<caminho.length;i++) pctx.lineTo(caminho[i].x, caminho[i].y); pctx.stroke();
    pctx.strokeStyle='rgba(255,255,255,0.12)'; pctx.lineWidth=6; pctx.setLineDash([15,12]); pctx.beginPath(); pctx.moveTo(caminho[0].x,caminho[0].y); for(let i=1;i<caminho.length;i++) pctx.lineTo(caminho[i].x, caminho[i].y); pctx.stroke(); pctx.setLineDash([]); pctx.lineWidth=1;
  }
  state.torres.length = 0; state.inimigos.length=0; state.projeteis.length=0; state.particles.length=0;
  const fallbackMoney = (CONFIG.ECONOMY.START_MONEY_BY_LEVEL[index] != null) ? CONFIG.ECONOMY.START_MONEY_BY_LEVEL[index] : 200;
  const money = (typeof lvl.startingMoney === 'number' && lvl.startingMoney > 0) ? lvl.startingMoney : fallbackMoney;
  state.numeroOnda=0; state.inimigosAtivos=0; state.wavesLaunchedThisLevel=0; state.dinheiro=money; state.vidas=CONFIG.ECONOMY.START_LIFE; state.jogoAcabou=false; state.bossAlive=false;
  if (CONFIG.DEBUG.ENABLED) console.debug('[Level] init money=', money, 'level=', index);
  updateHUD(elements, state);
  const btnEletrica = elements.btns.eletrica; if (btnEletrica) { btnEletrica.disabled = !(index >= 1); btnEletrica.style.opacity = btnEletrica.disabled ? '0.5':'1'; }
}

function desenharCaminho(){
  const caminho = state.caminho; if (!caminho.length) return;
  ctx.strokeStyle='#8B5A2B'; ctx.lineWidth=40; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(caminho[0].x,caminho[0].y); for(let i=1;i<caminho.length;i++) ctx.lineTo(caminho[i].x, caminho[i].y); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=6; ctx.setLineDash([15,12]); ctx.beginPath(); ctx.moveTo(caminho[0].x,caminho[0].y); for(let i=1;i<caminho.length;i++) ctx.lineTo(caminho[i].x, caminho[i].y); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth=1;
}

// WaveManager instancia e substitui fila manual
const waveManager = new WaveManager((waveNumber)=> spawnEnemy(waveNumber));

function criarOnda(){
  const lvl = levels[state.currentLevelIndex]; if(!lvl) return; if(state.wavesLaunchedThisLevel >= lvl.maxWaves) return;
  if(!state.pathInfo || !state.pathInfo.segments){ console.warn('[Wave] pathInfo ausente ou inválido; usando caminho cru'); }
  state.numeroOnda++; state.wavesLaunchedThisLevel++; state.inimigosAtivos = state.numeroOnda * 5; // base para condição de término
  events.emit('waveStarted', { wave: state.numeroOnda, level: state.currentLevelIndex });
  // Boss a cada 5 ondas
  if (state.numeroOnda % 5 === 0){ spawnBoss(); }
  // Agendar spawns da onda atual: intervalo base 0.8s
  const count = state.inimigosAtivos; const interval = 0.8; waveManager.scheduleWave(state.numeroOnda, count, interval);
}

function spawnBoss(){
  const vidaBase = 50 + state.numeroOnda * 10; const boss = new Inimigo(vidaBase, 0.6, state.pathInfo || state.caminho, 'boss'); boss.x = state.caminho[0].x - 30; boss.y = state.caminho[0].y; state.inimigos.push(boss); state.inimigosAtivos++; state.bossAlive=true; if(elements.eventoEl) elements.eventoEl.textContent='CHEFE apareceu!'; events.emit('bossSpawned', { wave: state.numeroOnda });
}

function spawnEnemy(forceWaveNumber){
  const n = forceWaveNumber || state.numeroOnda; const probForte = 0.06; const probGelo = Math.min(0.15, 0.02 + n * 0.01);
  const r = Math.random(); let tipo='normal';
  if (r < probForte) tipo='forte'; else if (r < probForte + probGelo) tipo='gelo';
  const pathRef = state.pathInfo || state.caminho;
  if (tipo==='forte'){ const vida=(50+n*20)*3; const vel=0.9+n*0.02; state.inimigos.push(new Inimigo(vida, vel, pathRef, 'forte', REWARD_MULT)); }
  else if (tipo==='gelo'){ const vida=(50+n*20)*2; const vel=Math.max(0.4, 0.8 - n*0.02); state.inimigos.push(new Inimigo(vida, vel, pathRef, 'gelo', REWARD_MULT)); }
  else { const vida=50+n*20; const vel=1+n*0.1; state.inimigos.push(new Inimigo(vida, vel, pathRef, 'normal', REWARD_MULT)); }
  return tipo;
}

function removerInimigo(enemy){ const idx = state.inimigos.indexOf(enemy); if (idx>-1){ state.inimigos.splice(idx,1); state.inimigosAtivos--; } }

function construirTorre(x,y){
  const tipo = state.tipoTorreSelecionada;
  const def = CONFIG.TOWERS[tipo];
  if (!def) return false;
  const custo = def.preco;
  if (state.dinheiro < custo) return false;
  // Área inválida simples (manter regra antiga)
  if (y > 120 && y < 380 && x > 270 && x < 530) return false;
  state.dinheiro -= custo;
  let t;
  if (tipo==='forte') t = new TorreForte(x,y,ctx);
  else if (tipo==='gelo') t=new TorreGelo(x,y,ctx);
  else if(tipo==='eletrica') t=new TorreEletrica(x,y,ctx);
  else {
    const tb = CONFIG.TOWERS.basica;
    t=new Torre(x,y,{ alcance:tb.alcance, dano:tb.dano, taxaDisparo:tb.taxaFrames, preco:tb.preco, tipo:'basica' },ctx);
  }
  state.torres.push(t); events.emit('towerBuilt', { type: tipo, x, y }); return true;
}

// Interações UI
function setupUI(){
  const { btns, overlays, victory } = elements;
  btns.basica.addEventListener('click', ()=>{ state.tipoTorreSelecionada='basica'; state.sellMode=false; highlightSelected(); });
  btns.forte.addEventListener('click', ()=>{ state.tipoTorreSelecionada='forte'; state.sellMode=false; highlightSelected(); });
  btns.gelo.addEventListener('click', ()=>{ state.tipoTorreSelecionada='gelo'; state.sellMode=false; highlightSelected(); });
  if (btns.eletrica) btns.eletrica.addEventListener('click', ()=>{ if(btns.eletrica.disabled) return; state.tipoTorreSelecionada='eletrica'; state.sellMode=false; highlightSelected(); });
  btns.vender.addEventListener('click', ()=>{ state.sellMode=!state.sellMode; highlightSelected(); });

  btns.start.addEventListener('click', ()=>{ state.gameStarted=true; overlays.mainMenu.remove(); criarOnda(); });
  btns.cont.addEventListener('click', ()=>{ state.gameStarted=true; state.dinheiro+=1300; state.numeroOnda+=2; if(elements.eventoEl) elements.eventoEl.textContent='Modo Debug ativo'; overlays.mainMenu.remove(); criarOnda(); });
  btns.nextLevel.addEventListener('click', ()=>{ const next = state.currentLevelIndex+1; if (next < levels.length){ loadLevel(next); btns.nextLevel.style.display='none'; }});
  btns.openLevels.addEventListener('click', ()=> openLevelSelector(elements, (i)=> loadLevel(i)) );
  btns.closeLevels.addEventListener('click', ()=> closeLevelSelector(elements));
  victory.continueBtn.addEventListener('click', ()=>{ if(_pendingNextLevel!=null){ loadLevel(_pendingNextLevel); hideVictory(elements); _pendingNextLevel=null; } else hideVictory(elements); });
  victory.closeBtn.addEventListener('click', ()=>{ hideVictory(elements); openLevelSelector(elements,(i)=>loadLevel(i)); });

  // Tooltips via service
  services.tooltip = new TooltipService(elements);
  services.tooltip.bindTowerButton('basica', btns.basica);
  services.tooltip.bindTowerButton('forte', btns.forte);
  services.tooltip.bindTowerButton('gelo', btns.gelo);
  services.tooltip.bindTowerButton('eletrica', btns.eletrica);
  highlightSelected();
}

function tooltipHTML(key){ return tooltipFromTowerKey(key); }

function highlightSelected(){
  const { btns } = elements; const sel = state.tipoTorreSelecionada; const colorOn='#4CAF50'; const reset=(b)=>{ b.style.background=''; b.style.color=''; };
  [btns.basica, btns.forte, btns.gelo, btns.eletrica].forEach(b=>{ if(b) reset(b); });
  if (state.sellMode) { btns.vender.style.background='#b91c1c'; } else btns.vender.style.background='#444';
  const map = { basica: btns.basica, forte: btns.forte, gelo: btns.gelo, eletrica: btns.eletrica };
  const btn = map[sel]; if(btn){ btn.style.background=colorOn; btn.style.color='#fff'; }
}

// Canvas interactions
canvas.addEventListener('click', (e)=>{
  if(state.jogoAcabou || !state.gameStarted) return;
  const rect = canvas.getBoundingClientRect(); const sx = canvas.width/rect.width; const sy = canvas.height/rect.height;
  const x = (e.clientX - rect.left) * sx; const y = (e.clientY - rect.top) * sy;
  if (state.sellMode) { // tentativa de venda
  for (let i=0;i<state.torres.length;i++){ const t=state.torres[i]; const dx=t.x-x; const dy=t.y-y; if(dx*dx+dy*dy<25*25){ const refund=Math.floor((t.price||CONFIG.TOWERS.basica.preco)*CONFIG.ECONOMY.SELL_REFUND_RATIO); state.dinheiro+=refund; const removed=state.torres.splice(i,1)[0]; events.emit('towerSold', { type: removed.tipo, x: removed.x, y: removed.y, refund }); state.sellMode=false; highlightSelected(); return; }}
    return;
  }
  construirTorre(x,y); // silent fail se inválido
});

// Loop principal com delta time (referência 60 FPS)
let _pendingNextLevel = null;
let _lastTs = performance.now();
function gameLoop(now){
  const dtMs = now - _lastTs; _lastTs = now;
  // dtScale em "frames de 60fps": 1000/60 ≈ 16.666ms
  const dtScale = Math.min(3, dtMs / (1000/60)); // clamp para evitar saltos grandes (abaixo de 20 FPS)
  if (state.jogoAcabou){ ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='red'; ctx.font='60px Arial'; ctx.textAlign='center'; ctx.fillText('FIM DE JOGO', canvas.width/2, canvas.height/2); return; }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (state.pathCanvas) ctx.drawImage(state.pathCanvas,0,0); updateHUD(elements, state);
  // Reconstroi índice espacial de inimigos antes da busca das torres
  const spatial = state.spatial; spatial.clear();
  for (const inimigo of state.inimigos) spatial.insert(inimigo);
  // Torres
  state.torres.forEach(t => t.update(state, dtScale));
  // Inimigos
  state.inimigos.forEach(inimigo => {
    inimigo.update((enemy)=>{ if(enemy.tipo==='boss'){ state.jogoAcabou=true; if(elements.eventoEl) elements.eventoEl.textContent='Chefe venceu'; events.emit('gameOver', { reason: 'bossReached'}); } else { state.vidas--; removerInimigo(enemy); events.emit('enemyEscaped', { type: enemy.tipo }); } }, dtScale);
    inimigo.draw(ctx);
  });
  // Projéteis
  for (let i=state.projeteis.length-1;i>=0;i--){ const p = state.projeteis[i]; p.draw(ctx); if (p.update(state.particles, dtScale)) { projectilePool.release(p); state.projeteis.splice(i,1); } }
  // Partículas
  updateParticles(state.particles, ctx, dtScale);
  // Limpar inimigos mortos
  for (let i=state.inimigos.length-1;i>=0;i--){ const enemy=state.inimigos[i]; if (enemy.vida<=0){ state.dinheiro += enemy.recompensa; events.emit('enemyKilled', { type: enemy.tipo, reward: enemy.recompensa, wave: state.numeroOnda }); if(enemy.tipo==='boss'){ state.bossAlive=false; if(elements.eventoEl) elements.eventoEl.textContent=''; events.emit('bossDefeated', { wave: state.numeroOnda }); const cur=state.currentLevelIndex; const next=cur+1; if(next<levels.length){ unlockNextLevelIfAny(cur); _pendingNextLevel=next; showVictory(elements, cur, next); } else { showVictory(elements, cur, null); } } removerInimigo(enemy); }}
  // Condições pós-onda
  if (state.vidas<=0) { state.jogoAcabou=true; events.emit('gameOver', { reason: 'livesDepleted'}); }
  if (state.gameStarted && state.inimigos.length===0 && state.inimigosAtivos===0){
    const lvl = levels[state.currentLevelIndex];
    if (lvl && state.wavesLaunchedThisLevel >= lvl.maxWaves){
      if (state.currentLevelIndex < levels.length-1){ elements.btns.nextLevel.style.display='block'; } else { elements.btns.nextLevel.style.display='none'; }
    } else criarOnda();
  }
  // Atualizar agendamentos de waves
  waveManager.update(dtMs/1000);
  requestAnimationFrame(gameLoop);
}

// Inicialização
// Inicialização com serviços
loadLevel(0); 
setupUI();
services.persistence = new PersistenceService(state);
services.audio = new AudioService();
window.__TD_SERVICES__ = services;
window.__TD_READY__ = true; 
requestAnimationFrame(gameLoop);

// Expor para debug rápido
window.__TD_STATE__ = state;
window.__TD_POOLS__ = { projectiles: projectilePool, particles: particlePool };
window.__TD_WAVE__ = waveManager;
window.__TD_RENDER__ = { cache: renderCacheDebug };
window.__TD_SPATIAL__ = { ref: ()=> state.spatial, stats: ()=> state.spatial.debugStats() };
