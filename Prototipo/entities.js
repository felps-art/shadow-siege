// entities.js - Classes e estruturas base relacionadas a torres, inimigos, projéteis e partículas.
// Mantém foco apenas nos aspectos de dados/comportamento. Renderização usa o contexto passado.
// Introduz GameObject base para padronizar interface update/draw.

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
    for (const inimigo of inimigos) {
      const dx = this.x - inimigo.x; const dy = this.y - inimigo.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.alcance) return inimigo;
    }
    return null;
  }
  update(state) {
    if (this.cooldown > 0) this.cooldown--;
    const alvo = this.encontrarAlvo(state.inimigos);
    if (alvo && this.cooldown === 0) {
      state.projeteis.push(new Projetil(this.x, this.y, alvo, this.dano));
      this.cooldown = this.taxaDisparo;
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(this.x - 15, this.y - 15, this.x + 15, this.y + 15);
    g.addColorStop(0, '#3b82f6'); g.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6;
    ctx.fillRect(this.x - 15, this.y - 15, 30, 30); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,58,138,0.06)'; ctx.fill();
  }
}

export class TorreForte extends Torre {
  constructor(x, y, ctxRef) {
    super(x, y, { alcance:150, dano:250, taxaDisparo:100, preco:120, tipo:'forte' }, ctxRef);
  }
  draw() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(this.x - 18, this.y - 18, this.x + 18, this.y + 18);
    g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#4c1d95');
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8;
    ctx.fillRect(this.x - 18, this.y - 18, 36, 36); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76,29,149,0.06)'; ctx.fill();
  }
}

export class TorreGelo extends Torre {
  constructor(x, y, ctxRef) {
    super(x, y, { alcance:130, dano:100, taxaDisparo:90, preco:120, tipo:'gelo' }, ctxRef);
  }
  update(state) {
    if (this.cooldown > 0) this.cooldown--;
    const alvo = this.encontrarAlvo(state.inimigos);
    if (alvo && this.cooldown === 0) {
      const p = new Projetil(this.x, this.y, alvo, this.dano);
      p.slowAmount = 0.5; p.slowDuration = 240;
      state.projeteis.push(p);
      this.cooldown = this.taxaDisparo;
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(this.x - 16, this.y - 16, this.x + 16, this.y + 16);
    g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#0369a1');
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(3,105,161,0.45)'; ctx.shadowBlur = 8;
    ctx.fillRect(this.x - 16, this.y - 16, 32, 32); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(125,206,240,0.08)'; ctx.fill();
  }
}

export class TorreEletrica extends Torre {
  constructor(x, y, ctxRef) {
    super(x, y, { alcance:140, dano:100, taxaDisparo:120, preco:120, tipo:'eletrica' }, ctxRef);
  }
  encontrarAlvos(inimigos, max=3) {
    const arr = [];
    for (const inimigo of inimigos) {
      const dx = inimigo.x - this.x; const dy = inimigo.y - this.y; const dist = Math.hypot(dx, dy);
      if (dist <= this.alcance) arr.push({ inimigo, dist });
    }
    arr.sort((a,b)=>a.dist-b.dist); return arr.slice(0,max).map(r=>r.inimigo);
  }
  update(state) {
    if (this.cooldown > 0) this.cooldown--;
    const alvos = this.encontrarAlvos(state.inimigos, 3);
    if (alvos.length && this.cooldown===0) {
      for (const alvo of alvos) state.projeteis.push(new Projetil(this.x, this.y, alvo, this.dano));
      this.cooldown = this.taxaDisparo;
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(this.x - 18, this.y - 18, this.x + 18, this.y + 18);
    g.addColorStop(0, '#f97316'); g.addColorStop(1, '#f59e0b');
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(249,115,22,0.4)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(this.x - 10, this.y - 14);
    ctx.lineTo(this.x + 12, this.y - 2); ctx.lineTo(this.x - 4, this.y + 14);
    ctx.lineTo(this.x + 10, this.y + 14); ctx.lineTo(this.x - 6, this.y - 2);
    ctx.lineTo(this.x + 8, this.y - 14); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.alcance, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,200,0.02)'; ctx.fill();
  }
}

export class Inimigo extends GameObject {
  constructor(vida, velocidade, caminho, tipo='normal', rewardMult=2) {
    super();
    this.caminho = caminho;
    this.x = caminho[0].x; this.y = caminho[0].y; this.pontoCaminhoIndex = 0;
    this.velocidade = velocidade; this.tipo = tipo;
    this.vidaMaxima = (tipo === 'boss') ? vida * 100 : vida;
    this.vida = this.vidaMaxima; this.raio = 10;
    let recompensaBase = 5;
    if (tipo === 'gelo') { this.raio = 12; recompensaBase = Math.max(3, Math.floor(this.vidaMaxima/30)); }
    else if (tipo === 'forte') { this.raio = 14; recompensaBase = Math.max(8, Math.floor(this.vidaMaxima/50)); }
    else if (tipo === 'boss') { this.raio = 26; recompensaBase = Math.max(50, Math.floor(this.vidaMaxima/50)); }
    this.recompensa = recompensaBase * rewardMult;
  }
  update(onReachEnd) {
    if (this.tipo !== 'gelo' && this._slow && this._slow.remaining > 0) {
      this._slow.remaining--; if (!this._slow.remaining) { this.velocidade = this._slow.originalVelocidade; delete this._slow; }
    }
    const caminho = this.caminho;
    if (this.pontoCaminhoIndex < caminho.length - 1) {
      const destino = caminho[this.pontoCaminhoIndex + 1];
      const ang = Math.atan2(destino.y - this.y, destino.x - this.x);
      this.x += Math.cos(ang) * this.velocidade; this.y += Math.sin(ang) * this.velocidade;
      const dx = this.x - destino.x; const dy = this.y - destino.y;
      if (dx*dx + dy*dy < this.velocidade*this.velocidade) this.pontoCaminhoIndex++;
    } else if (onReachEnd) {
      onReachEnd(this);
    }
  }
  draw(ctx) {
    let outer='#FF0000', inner='#ff7b7b';
    if (this.tipo==='gelo'){ outer='#7ec8ff'; inner='#cfeeff'; }
    else if (this.tipo==='forte'){ outer='#7f0000'; inner='#ffb3b3'; }
    const g = ctx.createRadialGradient(this.x - this.raio/3, this.y - this.raio/3, 1, this.x, this.y, this.raio);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=2; ctx.stroke();
    if (this.tipo==='boss') { ctx.fillStyle='#fff'; ctx.font='16px Arial'; ctx.textAlign='center'; ctx.fillText('Chefe', this.x, this.y - this.raio - 12); }
    const pct = this.vida/this.vidaMaxima; ctx.fillStyle='#FF0000';
    ctx.fillRect(this.x - this.raio, this.y - this.raio - 10, this.raio*2,5);
    ctx.fillStyle='#00FF00'; ctx.fillRect(this.x - this.raio, this.y - this.raio - 10, this.raio*2*pct,5);
  }
}

export class Projetil extends GameObject {
  constructor(x,y,alvo,dano){ this.x=x; this.y=y; this.alvo=alvo; this.velocidade=5; this.dano=dano; this.slowAmount=0; this.slowDuration=0; this.raio=3; }
  update(particles){
    const ang = Math.atan2(this.alvo.y - this.y, this.alvo.x - this.x);
    this.x += Math.cos(ang)*this.velocidade; this.y += Math.sin(ang)*this.velocidade;
    const dx = this.x - this.alvo.x; const dy = this.y - this.alvo.y;
    if (dx*dx + dy*dy < this.alvo.raio*this.alvo.raio){
      let danoAplicado = this.dano; const gelo = this.slowAmount>0 && this.slowDuration>0;
      if (gelo && this.alvo.tipo==='gelo') danoAplicado = Math.ceil(danoAplicado/2);
      this.alvo.vida -= danoAplicado; if (gelo) aplicarSlow(this.alvo, this.slowAmount, this.slowDuration);
      spawnParticles(this.x,this.y, gelo? '#aeeeff' : (this.dano>=200? '#ffd27f':'#fff176'), 8, particles);
      return true;
    }
    return false;
  }
  draw(ctx){
    if (this.slowAmount>0) { ctx.fillStyle='#bde6ff'; ctx.shadowColor='#7dd3fc'; }
    else if (this.dano>=200) { ctx.fillStyle='#ffd27f'; ctx.shadowColor='#ffb84d'; }
    else { ctx.fillStyle='#fff176'; ctx.shadowColor='#ffd54f'; }
    ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(this.x,this.y,this.raio,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  }
}

export function aplicarSlow(inimigo, slowAmount, slowDuration){
  if (!inimigo._slow) inimigo._slow = { originalVelocidade: inimigo.velocidade, remaining:0 };
  const novoVel = inimigo._slow.originalVelocidade * (1 - slowAmount);
  inimigo.velocidade = Math.min(inimigo.velocidade, novoVel);
  inimigo._slow.remaining = Math.max(inimigo._slow.remaining, slowDuration);
}

// Partículas simples
export function spawnParticles(x,y,color,count,particles){
  for (let i=0;i<count;i++) particles.push({ x, y, vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3, life:20+Math.random()*20, color, size:1+Math.random()*2 });
}

export function updateParticles(particles, ctx){
  for (let i=particles.length-1;i>=0;i--){
    const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 1;
    ctx.globalAlpha = Math.max(0, p.life/40); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    if (p.life<=0) particles.splice(i,1);
  }
}
