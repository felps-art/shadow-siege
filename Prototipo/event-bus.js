// event-bus.js - Barramento de eventos simples para desacoplar módulos.
// API:
//  on(event, handler) -> unsubscribe fn
//  once(event, handler)
//  off(event, handler)
//  emit(event, payload)
//  listeners(event) -> array (debug)
// Uso típico:
//  import { events } from './event-bus.js';
//  events.on('enemyKilled', e => { ... });
//  events.emit('enemyKilled', { enemy, wave: state.numeroOnda });

class EventBus {
  constructor(){ this._map = new Map(); }
  on(evt, fn){
    if(!this._map.has(evt)) this._map.set(evt, new Set());
    this._map.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn){
    const wrap = (data)=>{ try { fn(data); } finally { this.off(evt, wrap); } };
    return this.on(evt, wrap);
  }
  off(evt, fn){ const set = this._map.get(evt); if(set){ set.delete(fn); if(!set.size) this._map.delete(evt); } }
  emit(evt, data){ const set = this._map.get(evt); if(set){ for(const fn of [...set]){ try { fn(data); } catch(e){ console.error('[event-bus handler error]', evt, e); } } } }
  listeners(evt){ const set = this._map.get(evt); return set ? Array.from(set) : []; }
  clear(){ this._map.clear(); }
}

export const events = new EventBus();
// Debug global opcional
if (typeof window !== 'undefined') window.__TD_EVENTS__ = events;
