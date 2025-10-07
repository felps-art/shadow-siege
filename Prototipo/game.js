// game.js - Orquestra o estado principal, loop e integra módulos
import { levels, clonePath } from './levels.js';
import { Torre, TorreForte, TorreGelo, TorreEletrica, Inimigo, Projetil, updateParticles } from './entities.js';
import { getElements, updateHUD, tooltipShow, tooltipHide, unlockNextLevelIfAny, showVictory, hideVictory, openLevelSelector, closeLevelSelector } from './ui.js';

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
  currentLevelIndex: 0,
  wavesLaunchedThisLevel: 0,
  torres: [],
  inimigos: [],
  projeteis: [],
  particles: [],
  pendingBuild: null,
  isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints>0)
};

const REWARD_MULT = 2;
const COST_BASIC = 50;
const COST_STRONG = 120;

const elements = getElements();
const canvas = elements.canvas; const ctx = canvas.getContext('2d');

// Lista de stats para tooltips
const stats = {
  basica: { nome:'Torre Básica', preco:COST_BASIC, dano:100, alcance:120, taxa:'80 frames' },
  forte: { nome:'Torre Forte', preco:COST_STRONG, dano:250, alcance:150, taxa:'100 frames' },
  gelo: { nome:'Torre Gelo', preco:COST_STRONG, dano:100, alcance:130, taxa:'90 frames', efeito:'Slow 50% ~4s' },
  eletrica: { nome:'Torre Elétrica', preco:COST_STRONG, dano:100, alcance:140, taxa:'120 frames', efeito:'Atira até 3 alvos' }
};

function loadLevel(index){
  if (index < 0 || index >= levels.length) return;
  state.currentLevelIndex = index;
  const lvl = levels[index];
  state.caminho = clonePath(lvl.caminho);
  state.torres.length = 0; state.inimigos.length=0; state.projeteis.length=0; state.particles.length=0;
  state.numeroOnda=0; state.inimigosAtivos=0; state.wavesLaunchedThisLevel=0; state.dinheiro=lvl.startingMoney; state.vidas=20; state.jogoAcabou=false; state.bossAlive=false;
  updateHUD(elements, state);
  const btnEletrica = elements.btns.eletrica; if (btnEletrica) { btnEletrica.disabled = !(index >= 1); btnEletrica.style.opacity = btnEletrica.disabled ? '0.5':'1'; }
}

function desenharCaminho(){
  const caminho = state.caminho; if (!caminho.length) return;
  ctx.strokeStyle='#8B5A2B'; ctx.lineWidth=40; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(caminho[0].x,caminho[0].y); for(let i=1;i<caminho.length;i++) ctx.lineTo(caminho[i].x, caminho[i].y); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=6; ctx.setLineDash([15,12]); ctx.beginPath(); ctx.moveTo(caminho[0].x,caminho[0].y); for(let i=1;i<caminho.length;i++) ctx.lineTo(caminho[i].x, caminho[i].y); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth=1;
}

function criarOnda(){
  const lvl = levels[state.currentLevelIndex]; if(!lvl) return; if(state.wavesLaunchedThisLevel >= lvl.maxWaves) return;
  state.numeroOnda++; state.wavesLaunchedThisLevel++; state.inimigosAtivos = state.numeroOnda * 5;
  const bossInterval = 5; const spawnBoss = (state.numeroOnda % bossInterval === 0);
  if (spawnBoss) { const vidaBase = 50 + state.numeroOnda * 10; const boss = new Inimigo(vidaBase, 0.6, state.caminho, 'boss'); boss.x = state.caminho[0].x - 30; boss.y = state.caminho[0].y; state.inimigos.push(boss); state.inimigosAtivos++; state.bossAlive=true; if(elements.eventoEl) elements.eventoEl.textContent='CHEFE apareceu!'; }
  // Spawn incremental via fila de tempos (simples substituição do setTimeout original)
  const totalBase = state.inimigosAtivos;
  let accumulator = 0; // frames
  const spawnList = [];
  for (let i=0;i<totalBase;i++) {
    const delay = i * 50; // 50 frames ~ 800ms se 16ms/frame => manter ritmo aproximado
    spawnList.push(delay);
  }
  waveSpawnQueue.push({ delays: spawnList, spawned:0 });
}

const waveSpawnQueue = [];
function processWaveSpawns(){
  if (!waveSpawnQueue.length) return;
  for (let i=waveSpawnQueue.length-1;i>=0;i--) {
    const w = waveSpawnQueue[i]; w._t = (w._t||0)+1; // frame counter
    while (w.spawned < w.delays.length && w._t >= w.delays[w.spawned]) {
      spawnEnemy(); w.spawned++;
    }
    if (w.spawned >= w.delays.length) waveSpawnQueue.splice(i,1);
  }
}

function spawnEnemy(){
  const n = state.numeroOnda; const probForte = 0.06; const probGelo = Math.min(0.15, 0.02 + n * 0.01);
  const r = Math.random(); let tipo='normal';
  if (r < probForte) tipo='forte'; else if (r < probForte + probGelo) tipo='gelo';
  if (tipo==='forte'){ const vida=(50+n*20)*3; const vel=0.9+n*0.02; state.inimigos.push(new Inimigo(vida, vel, state.caminho, 'forte', REWARD_MULT)); }
  else if (tipo==='gelo'){ const vida=(50+n*20)*2; const vel=Math.max(0.4, 0.8 - n*0.02); state.inimigos.push(new Inimigo(vida, vel, state.caminho, 'gelo', REWARD_MULT)); }
  else { const vida=50+n*20; const vel=1+n*0.1; state.inimigos.push(new Inimigo(vida, vel, state.caminho, 'normal', REWARD_MULT)); }
}

function removerInimigo(enemy){ const idx = state.inimigos.indexOf(enemy); if (idx>-1){ state.inimigos.splice(idx,1); state.inimigosAtivos--; } }

function construirTorre(x,y){
  const tipo = state.tipoTorreSelecionada;
  const custo = (tipo==='forte'||tipo==='gelo'||tipo==='eletrica') ? COST_STRONG : COST_BASIC;
  if (state.dinheiro < custo) return false;
  // Área inválida simples (manter regra antiga):
  if (y > 120 && y < 380 && x > 270 && x < 530) return false;
  state.dinheiro -= custo;
  let t;
  if (tipo==='forte') t = new TorreForte(x,y,ctx); else if (tipo==='gelo') t=new TorreGelo(x,y,ctx); else if(tipo==='eletrica') t=new TorreEletrica(x,y,ctx); else t=new Torre(x,y,{},ctx);
  state.torres.push(t); return true;
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

  // Tooltips
  const map = { basica:btns.basica, forte:btns.forte, gelo:btns.gelo, eletrica:btns.eletrica };
  for (const key of Object.keys(map)) { const btn = map[key]; if(!btn) continue; btn.addEventListener('mouseenter',(e)=> tooltipShow(elements, tooltipHTML(key), btn)); btn.addEventListener('mouseleave',()=> tooltipHide(elements)); }
  highlightSelected();
}

function tooltipHTML(key){ const s = stats[key]; if(!s) return ''; return `<strong>${s.nome}</strong><br>Preço: $${s.preco}<br>Dano: ${s.dano}<br>Alcance: ${s.alcance}<br>Taxa: ${s.taxa}${s.efeito?`<br>${s.efeito}`:''}`; }

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
    for (let i=0;i<state.torres.length;i++){ const t=state.torres[i]; const dx=t.x-x; const dy=t.y-y; if(dx*dx+dy*dy<25*25){ const refund=Math.floor((t.price||COST_BASIC)*0.5); state.dinheiro+=refund; state.torres.splice(i,1); state.sellMode=false; highlightSelected(); return; }}
    return;
  }
  construirTorre(x,y); // silent fail se inválido
});

// Loop principal
let _pendingNextLevel = null;
function gameLoop(){
  if (state.jogoAcabou){ ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='red'; ctx.font='60px Arial'; ctx.textAlign='center'; ctx.fillText('FIM DE JOGO', canvas.width/2, canvas.height/2); return; }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  desenharCaminho(); updateHUD(elements, state);
  // Torres
  state.torres.forEach(t => t.update(state));
  // Inimigos
  state.inimigos.forEach(inimigo => {
    inimigo.update((enemy)=>{ if(enemy.tipo==='boss'){ state.jogoAcabou=true; if(elements.eventoEl) elements.eventoEl.textContent='Chefe venceu'; } else { state.vidas--; removerInimigo(enemy); } });
    inimigo.draw(ctx);
  });
  // Projéteis
  for (let i=state.projeteis.length-1;i>=0;i--){ const p = state.projeteis[i]; p.draw(ctx); if (p.update(state.particles)) state.projeteis.splice(i,1); }
  // Partículas
  updateParticles(state.particles, ctx);
  // Limpar inimigos mortos
  for (let i=state.inimigos.length-1;i>=0;i--){ const enemy=state.inimigos[i]; if (enemy.vida<=0){ state.dinheiro += enemy.recompensa; if(enemy.tipo==='boss'){ state.bossAlive=false; if(elements.eventoEl) elements.eventoEl.textContent=''; const cur=state.currentLevelIndex; const next=cur+1; if(next<levels.length){ unlockNextLevelIfAny(cur); _pendingNextLevel=next; showVictory(elements, cur, next); } else { showVictory(elements, cur, null); } } removerInimigo(enemy); }}
  // Condições pós-onda
  if (state.vidas<=0) state.jogoAcabou=true;
  if (state.gameStarted && state.inimigos.length===0 && state.inimigosAtivos===0){
    const lvl = levels[state.currentLevelIndex];
    if (lvl && state.wavesLaunchedThisLevel >= lvl.maxWaves){
      if (state.currentLevelIndex < levels.length-1){ elements.btns.nextLevel.style.display='block'; } else { elements.btns.nextLevel.style.display='none'; }
    } else criarOnda();
  }
  processWaveSpawns();
  requestAnimationFrame(gameLoop);
}

// Inicialização
loadLevel(0); setupUI(); gameLoop();

// Expor para debug rápido
window.__TD_STATE__ = state;
