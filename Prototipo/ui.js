// ui.js - Funções de interface: tooltips, menus, seletor de níveis, vitória, etc.
import { levels } from './levels.js';
import { events } from './event-bus.js';

const LS_KEY_UNLOCK = 'sd_unlocked_levels_v1';

export function getElements(){
  return {
    dinheiroEl: document.getElementById('dinheiro'),
    vidasEl: document.getElementById('vidas'),
    ondaEl: document.getElementById('onda'),
    eventoEl: document.getElementById('evento'),
    tooltip: document.getElementById('tooltip'),
    btns: {
      basica: document.getElementById('btn-torre-basica'),
      forte: document.getElementById('btn-torre-forte'),
      gelo: document.getElementById('btn-torre-gelo'),
      eletrica: document.getElementById('btn-torre-eletrica'),
      vender: document.getElementById('btn-vender-torre'),
      start: document.getElementById('btn-start'),
      cont: document.getElementById('btn-continue'),
      openLevels: document.getElementById('btn-open-levels'),
      closeLevels: document.getElementById('btn-close-levels'),
      nextLevel: document.getElementById('btn-next-level'),
    },
    overlays: {
      mainMenu: document.getElementById('main-menu'),
      levelSelector: document.getElementById('level-selector'),
      victory: document.getElementById('victory-overlay')
    },
    victory: {
      title: document.getElementById('victory-title'),
      msg: document.getElementById('victory-msg'),
      continueBtn: document.getElementById('victory-continue'),
      closeBtn: document.getElementById('victory-close')
    },
    levelGrid: document.getElementById('level-grid'),
    canvas: document.getElementById('gameCanvas')
  };
}

export function updateHUD(elements, state){
  elements.dinheiroEl.textContent = `Dinheiro: $${state.dinheiro}`;
  elements.vidasEl.textContent = `Vidas: ${state.vidas}`;
  elements.ondaEl.textContent = `Onda: ${state.numeroOnda}`;
}

// Listeners de UI desacoplados (exemplos)
if (typeof window !== 'undefined') {
  events.on('bossSpawned', ({ wave }) => {
    const el = document.getElementById('evento'); if (el) el.textContent = 'CHEFE apareceu (onda '+wave+')';
  });
  events.on('bossDefeated', ({ wave }) => {
    const el = document.getElementById('evento'); if (el) el.textContent = '';
  });
  events.on('enemyKilled', ({ type, reward }) => {
    // Debug: poderia acumular métricas ou um pequeno flash; manter leve.
    if (window.__TD_DEBUG_METRICS__) {
      window.__TD_DEBUG_METRICS__.kills = (window.__TD_DEBUG_METRICS__.kills||0)+1;
    }
  });
}

export function tooltipShow(elements, content, target){
  const el = elements.tooltip; el.innerHTML = content; el.style.display='block';
  const rect = target.getBoundingClientRect();
  el.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  el.style.left = (rect.left + window.scrollX) + 'px';
}
export function tooltipHide(elements){ elements.tooltip.style.display='none'; }

export function getUnlockedLevels(){
  try { const raw = localStorage.getItem(LS_KEY_UNLOCK); if(!raw) return [0]; const parsed = JSON.parse(raw); if(Array.isArray(parsed)) return parsed; } catch(e){}
  return [0];
}
export function saveUnlockedLevels(arr){ try { localStorage.setItem(LS_KEY_UNLOCK, JSON.stringify(arr)); } catch(e){} }
export function isUnlocked(i){ return getUnlockedLevels().includes(i); }
export function unlockLevel(i){ const u = getUnlockedLevels(); if(!u.includes(i)){ u.push(i); saveUnlockedLevels(u);} }
export function unlockNextLevelIfAny(cur){ const next = cur+1; if (next < levels.length) unlockLevel(next); }

export function renderLevelGrid(elements, onSelect){
  const grid = elements.levelGrid; grid.innerHTML='';
  for (let i=0;i<levels.length;i++) {
    const lvl = levels[i];
    const card = document.createElement('button'); card.className='level-card'; card.type='button';
    card.dataset.idx = String(i);
    const thumb = document.createElement('div'); thumb.className='thumb'; thumb.textContent = String(i+1);
    const meta = document.createElement('div');
    const nameEl = document.createElement('div'); nameEl.className='lvl-name'; nameEl.textContent = lvl.name || `Nível ${i+1}`;
    const infoEl = document.createElement('div'); infoEl.className='meta'; infoEl.textContent = `Dinheiro inicial: $${lvl.startingMoney} • Ondas: ${lvl.maxWaves}`;
    meta.appendChild(nameEl); meta.appendChild(infoEl);
    card.appendChild(thumb); card.appendChild(meta);
    if (!isUnlocked(i)) { card.disabled = true; const lock = document.createElement('div'); lock.className='locked-overlay'; lock.textContent='Bloqueado'; card.appendChild(lock); }
    card.addEventListener('click', ()=>{ if(!isUnlocked(i)) return; onSelect(i); closeLevelSelector(elements); });
    grid.appendChild(card);
  }
}

export function openLevelSelector(elements, onSelect){ renderLevelGrid(elements, onSelect); elements.overlays.levelSelector.style.display='flex'; }
export function closeLevelSelector(elements){ elements.overlays.levelSelector.style.display='none'; }

export function showVictory(elements, currentIdx, nextIdx){
  const { title, msg, continueBtn } = elements.victory;
  if (nextIdx == null) { title.textContent='Você venceu o jogo!'; msg.textContent='Parabéns — chefe final derrotado.'; continueBtn.style.display='none'; }
  else { title.textContent='Nível Concluído!'; const name = levels[currentIdx]?.name || `Nível ${currentIdx+1}`; msg.textContent=`Você completou ${name}. Próximo desafio?`; continueBtn.style.display=''; }
  elements.overlays.victory.style.display='flex';
}
export function hideVictory(elements){ elements.overlays.victory.style.display='none'; }
