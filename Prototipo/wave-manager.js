// wave-manager.js - Gerencia agendamento de spawns de inimigos por onda sem usar setTimeout
// Usa tempo acumulado em "frames 60fps" (dtScale) ou em segundos, independente do FPS
import { events } from './event-bus.js';

export class WaveManager {
  constructor(spawnCallback){
    this.spawnCallback = spawnCallback; // function(type)
    this.activeWaves = []; // [{schedule:[t0,t1,...], spawned:0, t:0, meta:{ waveNumber }}]
  }
  // agenda uma nova onda informando quantidade e intervalo base (em segundos)
  scheduleWave(waveNumber, count, intervalSeconds, bossConfig){
    const schedule = [];
    for (let i=0;i<count;i++) schedule.push(i * intervalSeconds);
    this.activeWaves.push({ schedule, spawned:0, t:0, meta:{ waveNumber, bossConfig } });
  }
  update(dtSeconds){
    if(!this.activeWaves.length) return;
    for (let i=this.activeWaves.length-1;i>=0;i--){
      const w = this.activeWaves[i];
      w.t += dtSeconds;
      while (w.spawned < w.schedule.length && w.t >= w.schedule[w.spawned]){
        const type = this.spawnCallback(w.meta.waveNumber);
        events.emit('enemySpawned', { wave: w.meta.waveNumber, type });
        w.spawned++;
      }
      if (w.spawned >= w.schedule.length) this.activeWaves.splice(i,1);
    }
  }
  isSpawning(){ return this.activeWaves.length>0; }
  debugInfo(){
    return this.activeWaves.map(w=>({ wave:w.meta.waveNumber, remaining: w.schedule.length - w.spawned }));
  }
}
