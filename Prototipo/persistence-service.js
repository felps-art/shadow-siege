// persistence-service.js - salva/recupera estado essencial do jogo
// Foco: session continuation (não histórico). Extensível para versioning/migrations.
// Eventos consumidos: towerBuilt, towerSold, enemyKilled, waveStarted, bossDefeated, gameOver

import { events } from './event-bus.js';
import { CONFIG } from './config.js';

const LS_KEY = 'td_session_v1';

export class PersistenceService {
  constructor(stateRef){
    this.state = stateRef; // referência do objeto state (não clonar a cada tick)
    this._pending = false;
    this._destroyed = false;
    this._register();
    this.load();
  }
  _register(){
    const auto = () => this.scheduleSave();
    events.on('towerBuilt', auto);
    events.on('towerSold', auto);
    events.on('waveStarted', auto);
    events.on('bossDefeated', auto);
    events.on('enemyKilled', (d)=>{ if (d && d.type==='boss') auto(); });
    events.on('gameOver', ()=>{ this.clear(); });
  }
  scheduleSave(){
    if (this._pending) return; this._pending = true;
    setTimeout(()=>{ if(!this._destroyed){ this._pending=false; this.save(); } }, 250); // debounce
  }
  snapshot(){
    const s = this.state;
    return {
      version: 1,
      level: s.currentLevelIndex,
      dinheiro: s.dinheiro,
      vidas: s.vidas,
      onda: s.numeroOnda,
      torres: s.torres.map(t=>({ x:t.x, y:t.y, tipo:t.tipo })),
      timestamp: Date.now()
    };
  }
  save(){
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.snapshot())); } catch(e){ console.warn('[Persistence] save falhou', e); }
  }
  load(){
    try {
      const raw = localStorage.getItem(LS_KEY); if(!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;
      if (data.version !== 1) return false; // placeholder para migração futura
      // Aplicar parcialmente (não recria ondas passadas, apenas estado base)
      const s = this.state;
      s.currentLevelIndex = data.level ?? 0;
      s.dinheiro = data.dinheiro ?? s.dinheiro;
      s.vidas = data.vidas ?? s.vidas;
      s.numeroOnda = data.onda ?? 0;
      // Torres serão reconstruídas externamente após loadLevel se necessário.
      this._loadedSnapshot = data;
      return true;
    } catch(e){ console.warn('[Persistence] load falhou', e); return false; }
  }
  clear(){ try { localStorage.removeItem(LS_KEY); } catch(e){} }
  destroy(){ this._destroyed = true; }
}
