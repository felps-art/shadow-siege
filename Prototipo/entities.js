// entities.js - Classes e estruturas base relacionadas a torres, inimigos, projéteis e partículas.
// Mantém foco apenas nos aspectos de dados/comportamento. Renderização usa o contexto passado.
// Introduz GameObject base para padronizar interface update/draw.
// Integração com CONFIG para centralizar valores de balanceamento.

import { CONFIG } from './config.js';
import { createPool } from './object-pool.js';
import { getTowerSprite, getEnemySprite } from './render-cache.js';

export class GameObject {
  constructor() {
    // Pode armazenar flags comuns (ex: markedForRemoval) futuramente
  }
  // Chamado a cada frame para lógica. Recebe estado/contexto flexível.
  update(/* state, dt */) {}
  // Responsável por desenhar.
  draw(/* ctx */) {}
}

export class Torre extends GameObject {
  constructor(x, y, config, ctxRef) {
    super();
    this.x = x; this.y = y; this.ctx = ctxRef;
    this.alcance = config.alcance || 120;
    this.dano = config.dano || 100;
    this.taxaDisparo = config.taxaDisparo || 80; // frames
    this.cooldown = 0;
    this.price = config.preco || 50;
    this.tipo = config.tipo || 'basica';
  }
  encontrarAlvo(inimigos) {
    // Se houver índice espacial no state (passado via update), use-o. Caso contrário, fallback linear.
    const stateRef = window.__TD_STATE__ || null; // fallback simples; ideal seria passar via arg
    let candidatos = inimigos;
    if (stateRef && stateRef.spatial){ candidatos = stateRef.spatial.queryCircle(this.x, this.y, this.alcance); }
    let melhor=null; let melhorDist=Infinity;
    for (const inimigo of candidatos){
      const dx = this.x - inimigo.x; const dy = this.y - inimigo.y; const d = dx*dx+dy*dy;
      if (d < this.alcance*this.alcance && d < melhorDist){ melhorDist = d; melhor = inimigo; }
    }
    return melhor;
  }
  // dtScale: fator relativo a 60 FPS (1 = 1 frame de 60fps). Mantemos unidades internas em "frames equivalentes".
  update(state, dtScale=1) {
    if (this.cooldown > 0) this.cooldown -= dtScale;
    const alvo = this.encontrarAlvo(state.inimigos);
    if (alvo && this.cooldown <= 0) {
  const p = projectilePool.borrow(); p.init(this.x, this.y, alvo, this.dano);
  state.projeteis.push(p);
      this.cooldown = this.taxaDisparo; // continua em unidade de frames equivalentes
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx; const sprite = getTowerSprite('basica');
    ctx.drawImage(sprite, this.x - sprite.width/2, this.y - sprite.height/2);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,58,138,0.06)'; ctx.fill();
  }
}

export class TorreForte extends Torre {
  constructor(x, y, ctxRef) {
    const t = CONFIG.TOWERS.forte;
    super(x, y, { alcance:t.alcance, dano:t.dano, taxaDisparo:t.taxaFrames, preco:t.preco, tipo:'forte' }, ctxRef);
  }
  draw() {
    const ctx = this.ctx; const sprite = getTowerSprite('forte');
    ctx.drawImage(sprite, this.x - sprite.width/2, this.y - sprite.height/2);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76,29,149,0.06)'; ctx.fill();
  }
}

export class TorreGelo extends Torre {
  constructor(x, y, ctxRef) {
    const t = CONFIG.TOWERS.gelo;
    super(x, y, { alcance:t.alcance, dano:t.dano, taxaDisparo:t.taxaFrames, preco:t.preco, tipo:'gelo' }, ctxRef);
    this._slowCfg = { amount: t.slowAmount, duration: t.slowDuration };
  }
  update(state, dtScale=1) {
    if (this.cooldown > 0) this.cooldown -= dtScale;
    const alvo = this.encontrarAlvo(state.inimigos);
    if (alvo && this.cooldown <= 0) {
  const p = projectilePool.borrow(); p.init(this.x, this.y, alvo, this.dano);
      p.slowAmount = this._slowCfg.amount; p.slowDuration = this._slowCfg.duration; // frames equivalentes
      state.projeteis.push(p);
      this.cooldown = this.taxaDisparo;
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx; const sprite = getTowerSprite('gelo');
    ctx.drawImage(sprite, this.x - sprite.width/2, this.y - sprite.height/2);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(125,206,240,0.08)'; ctx.fill();
  }
}

export class TorreEletrica extends Torre {
  constructor(x, y, ctxRef) {
    const t = CONFIG.TOWERS.eletrica;
    super(x, y, { alcance:t.alcance, dano:t.dano, taxaDisparo:t.taxaFrames, preco:t.preco, tipo:'eletrica' }, ctxRef);
    this._maxTargets = t.maxAlvos || 3;
  }
  encontrarAlvos(inimigos, max=this._maxTargets) {
    const stateRef = window.__TD_STATE__ || null;
    let candidatos = inimigos;
    if (stateRef && stateRef.spatial){ candidatos = stateRef.spatial.queryCircle(this.x, this.y, this.alcance); }
    const arr = [];
    for (const inimigo of candidatos){
      const dx = inimigo.x - this.x; const dy = inimigo.y - this.y; const dist = Math.hypot(dx, dy);
      if (dist <= this.alcance) arr.push({ inimigo, dist });
    }
    arr.sort((a,b)=>a.dist-b.dist); return arr.slice(0,max).map(r=>r.inimigo);
  }
  update(state, dtScale=1) {
    if (this.cooldown > 0) this.cooldown -= dtScale;
    const alvos = this.encontrarAlvos(state.inimigos, 3);
    if (alvos.length && this.cooldown<=0) {
  for (const alvo of alvos){ const p = projectilePool.borrow(); p.init(this.x, this.y, alvo, this.dano); state.projeteis.push(p); }
      this.cooldown = this.taxaDisparo;
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx; const sprite = getTowerSprite('eletrica');
    ctx.drawImage(sprite, this.x - sprite.width/2, this.y - sprite.height/2);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,200,0.02)'; ctx.fill();
  }
}

export class Inimigo extends GameObject {
  constructor(vida, velocidade, caminho, tipo='normal', rewardMult=2) {
    super();
    this.pontoCaminhoIndex = 0;
    this._segIndex = 0; this._segProgress = 0;
    let rawPath = caminho;
    if (!Array.isArray(caminho) && caminho && caminho.segments) {
      // caminho é o objeto { segments, totalLength }
      this._segments = caminho.segments;
      // Reconstrói um array de pontos (para compatibilidade fallback) a partir dos segmentos
      const pts = [];
      if (this._segments.length){
        pts.push(this._segments[0].a);
        for (const seg of this._segments) pts.push(seg.b);
      }
      rawPath = pts;
    }
    if (!Array.isArray(rawPath) || rawPath.length===0){ rawPath = [{x:0,y:0}]; }
    this.caminho = rawPath;
    // Posição inicial
    this.x = rawPath[0].x; this.y = rawPath[0].y;
    this.velocidade = velocidade; this.tipo = tipo;
    this.vidaMaxima = (tipo === 'boss') ? vida * 100 : vida;
    this.vida = this.vidaMaxima; this.raio = 10;
    let recompensaBase = 5;
    if (tipo === 'gelo') { this.raio = 12; recompensaBase = Math.max(3, Math.floor(this.vidaMaxima/30)); }
    else if (tipo === 'forte') { this.raio = 14; recompensaBase = Math.max(8, Math.floor(this.vidaMaxima/50)); }
    else if (tipo === 'boss') { this.raio = 26; recompensaBase = Math.max(50, Math.floor(this.vidaMaxima/50)); }
    this.recompensa = recompensaBase * rewardMult;
  }
  update(onReachEnd, dtScale=1) {
    if (this.tipo !== 'gelo' && this._slow && this._slow.remaining > 0) {
      this._slow.remaining -= dtScale; if (this._slow.remaining <= 0) { this.velocidade = this._slow.originalVelocidade; delete this._slow; }
    }
    if (this._segments) {
      // Movimento usando segmentos pré-computados
      const speed = this.velocidade * dtScale;
      let remaining = speed;
      while (remaining > 0 && this._segIndex < this._segments.length){
        const seg = this._segments[this._segIndex];
        const segRemaining = seg.length - this._segProgress;
        const step = Math.min(segRemaining, remaining);
        this._segProgress += step; remaining -= step; this.x = seg.a.x + seg.nx * this._segProgress; this.y = seg.a.y + seg.ny * this._segProgress;
        if (this._segProgress >= seg.length) { this._segIndex++; this._segProgress = 0; }
      }
      if (this._segIndex >= this._segments.length && remaining > 0) { if(onReachEnd) onReachEnd(this); }
    } else {
      // Caminho simples (fallback)
      const caminho = this.caminho;
      if (this.pontoCaminhoIndex < caminho.length - 1) {
        const destino = caminho[this.pontoCaminhoIndex + 1];
        const ang = Math.atan2(destino.y - this.y, destino.x - this.x);
        const step = this.velocidade * dtScale;
        this.x += Math.cos(ang) * step; this.y += Math.sin(ang) * step;
        const dx = this.x - destino.x; const dy = this.y - destino.y;
        if (dx*dx + dy*dy < step*step) this.pontoCaminhoIndex++;
      } else if (onReachEnd) {
        onReachEnd(this);
      }
    }
  }
  draw(ctx) {
    const sprite = getEnemySprite(this.tipo, this.raio); const sw = sprite.width; const sh = sprite.height;
    ctx.drawImage(sprite, this.x - sw/2, this.y - sh/2);
    if (this.tipo==='boss') { ctx.fillStyle='#fff'; ctx.font='16px Arial'; ctx.textAlign='center'; ctx.fillText('Chefe', this.x, this.y - this.raio - 12); }
    const pct = this.vida/this.vidaMaxima; ctx.fillStyle='#FF0000';
    ctx.fillRect(this.x - this.raio, this.y - this.raio - 10, this.raio*2,5);
    ctx.fillStyle='#00FF00'; ctx.fillRect(this.x - this.raio, this.y - this.raio - 10, this.raio*2*pct,5);
  }
}

export class Projetil extends GameObject {
  constructor(){ super(); this.active=false; this.x=0; this.y=0; this.alvo=null; this.velocidade=5; this.dano=0; this.slowAmount=0; this.slowDuration=0; this.raio=3; }
  init(x,y,alvo,dano){ this.active=true; this.x=x; this.y=y; this.alvo=alvo; this.dano=dano; this.slowAmount=0; this.slowDuration=0; }
  update(particles, dtScale=1){ if(!this.active||!this.alvo) return false; const ang = Math.atan2(this.alvo.y - this.y, this.alvo.x - this.x); const step = this.velocidade * dtScale; this.x += Math.cos(ang)*step; this.y += Math.sin(ang)*step; const dx = this.x - this.alvo.x; const dy = this.y - this.alvo.y; if (dx*dx + dy*dy < this.alvo.raio*this.alvo.raio){ let danoAplicado = this.dano; const gelo = this.slowAmount>0 && this.slowDuration>0; if (gelo && this.alvo.tipo==='gelo') danoAplicado = Math.ceil(danoAplicado/2); this.alvo.vida -= danoAplicado; if (gelo) aplicarSlow(this.alvo, this.slowAmount, this.slowDuration); spawnParticles(this.x,this.y, gelo? '#aeeeff' : (this.dano>=200? '#ffd27f':'#fff176'), 8, particles); return true; } return false; }
  draw(ctx){ if(!this.active) return; if (this.slowAmount>0) { ctx.fillStyle='#bde6ff'; ctx.shadowColor='#7dd3fc'; } else if (this.dano>=200) { ctx.fillStyle='#ffd27f'; ctx.shadowColor='#ffb84d'; } else { ctx.fillStyle='#fff176'; ctx.shadowColor='#ffd54f'; } ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(this.x,this.y,this.raio,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; }
  reset(){ this.active=false; this.alvo=null; }
}

export const projectilePool = createPool({
  create: ()=> new Projetil(),
  reset: (p)=> p.reset(),
  max: 1024,
  prewarm: 64
});

export function aplicarSlow(inimigo, slowAmount, slowDuration){
  if (!inimigo._slow) inimigo._slow = { originalVelocidade: inimigo.velocidade, remaining:0 };
  const novoVel = inimigo._slow.originalVelocidade * (1 - slowAmount);
  inimigo.velocidade = Math.min(inimigo.velocidade, novoVel);
  // Durations continuam em "frames equivalentes" então apenas acumula.
  inimigo._slow.remaining = Math.max(inimigo._slow.remaining, slowDuration);
}

// Partículas simples
// Partículas pooled
class Particle { constructor(){ this.active=false; this.x=0; this.y=0; this.vx=0; this.vy=0; this.life=0; this.color='#fff'; this.size=1; } init(x,y,color){ this.active=true; this.x=x; this.y=y; this.vx=(Math.random()-0.5)*3; this.vy=(Math.random()-0.5)*3; this.life=20+Math.random()*20; this.color=color; this.size=1+Math.random()*2; } reset(){ this.active=false; } }
export const particlePool = createPool({ create: ()=> new Particle(), reset: (p)=> p.reset(), max: 2048, prewarm: 128 });

export function spawnParticles(x,y,color,count,particles){
  for (let i=0;i<count;i++){ const p = particlePool.borrow(); p.init(x,y,color); particles.push(p); }
}

export function updateParticles(particles, ctx, dtScale=1){
  for (let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    if(!p.active){ particles.splice(i,1); continue; }
    p.x += p.vx * dtScale; p.y += p.vy * dtScale; p.vy += 0.08 * dtScale; p.life -= 1 * dtScale;
    ctx.globalAlpha = Math.max(0, p.life/40); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    if (p.life<=0){ particlePool.release(p); particles.splice(i,1); }
  }
}
