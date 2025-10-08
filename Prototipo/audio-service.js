// audio-service.js - feedback sonoro mínimo baseado em eventos.
// Strategy: Web Audio API simples + geração de tons (evita assets neste protótipo).
// Facilmente substituível por samples depois.

import { events } from './event-bus.js';

export class AudioService {
  constructor(options={}){
    this.enabled = true;
    this.volume = options.volume ?? 0.3;
    this.ctx = null;
    this._initEvents();
    this._userGestureBound = false;
  }
  ensureContext(){
    if (!this.ctx){ this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(freq=440, dur=0.15, type='sine', vol=this.volume){
    if (!this.enabled) return;
    try {
      this.ensureContext();
      const ctx = this.ctx; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.value = vol;
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur);
      // pequena queda de volume para suavizar final
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + dur);
    } catch(e){ /* ignore */ }
  }
  chord(freqs=[], dur=0.18, type='sine', vol=this.volume){ freqs.forEach((f,i)=> this.play(f, dur, type, vol * (1 - i*0.2))); }
  _initEvents(){
    // Adiar binding real até primeiro input do usuário para evitar bloqueio de autoplay
    const unlock = ()=>{ if(!this._userGestureBound){ this._userGestureBound=true; this.ensureContext(); window.removeEventListener('pointerdown', unlock); }};
    window.addEventListener('pointerdown', unlock, { once:true });

    events.on('towerBuilt', ()=> this.play(520, 0.12, 'square'));
    events.on('towerSold', ()=> this.play(300, 0.12, 'sawtooth'));
    events.on('enemyKilled', (d)=>{ const base = d.type==='boss'? 180 : 700; this.play(base, 0.08, 'triangle', 0.22); });
    events.on('waveStarted', (d)=> this.chord([440,660],0.22,'sine',0.25));
    events.on('bossSpawned', ()=> this.chord([160, 320, 480],0.5,'sawtooth',0.18));
    events.on('bossDefeated', ()=> this.chord([500,750,1000],0.4,'triangle',0.28));
    events.on('gameOver', (d)=> this.chord([90,60],0.8,'sine',0.2));
  }
}
