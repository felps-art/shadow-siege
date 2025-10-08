// config.js - Configurações centrais do protótipo Tower Defense
// Objetivo: ponto único de ajuste para balanceamento e futuras expansões (i18n, modos, etc.)

export const CONFIG = {
  ECONOMY: {
    START_LIFE: 20,
    START_MONEY_BY_LEVEL: [200, 250], // índice segue levels.js
    SELL_REFUND_RATIO: 0.5,
    REWARD_MULT: 2,
  },
  WAVES: {
    BOSS_INTERVAL: 5,
    ENEMIES_PER_WAVE_BASE: 5, // multiplicado pelo número da onda
    SPAWN_FRAME_GAP: 50, // usado na fila (frames equivalentes a 60fps)
  },
  TOWERS: {
    basica: { name: 'Torre Básica', preco: 50, dano: 100, alcance: 120, taxaFrames: 80 },
    forte: { name: 'Torre Forte', preco: 120, dano: 250, alcance: 150, taxaFrames: 100 },
    gelo: { name: 'Torre Gelo', preco: 120, dano: 100, alcance: 130, taxaFrames: 90, slowAmount: 0.5, slowDuration: 240 },
    eletrica: { name: 'Torre Elétrica', preco: 120, dano: 100, alcance: 140, taxaFrames: 120, maxAlvos: 3 },
  },
  ENEMIES: {
    baseVida: (onda)=>50 + onda * 20,
    forteVidaMult: 3,
    geloVidaMult: 2,
    bossVidaBase: (onda)=>50 + onda * 10,
    speedBase: (onda)=>1 + onda * 0.1,
    speedForte: (onda)=>0.9 + onda * 0.02,
    speedGelo: (onda)=>Math.max(0.4, 0.8 - onda * 0.02),
    bossSpeed: 0.6,
    probForte: 0.06,
    probGelo: (onda)=>Math.min(0.15, 0.02 + onda * 0.01),
  },
  DEBUG: {
    ENABLED: false,
    EXTRA_MONEY_CONTINUE: 1300,
  }
};

// Helper para gerar HTML de tooltip baseado em uma chave de torre
export function tooltipFromTowerKey(key){
  const t = CONFIG.TOWERS[key]; if(!t) return '';
  let html = `<strong>${t.name}</strong><br>Preço: $${t.preco}<br>Dano: ${t.dano}<br>Alcance: ${t.alcance}<br>Taxa: ${t.taxaFrames} frames`;
  if (key==='gelo') html += `<br>Slow ${(CONFIG.TOWERS.gelo.slowAmount*100)|0}% ~${(CONFIG.TOWERS.gelo.slowDuration/60).toFixed(1)}s`;
  if (key==='eletrica') html += `<br>Atira até ${t.maxAlvos} alvos`;
  return html;
}
