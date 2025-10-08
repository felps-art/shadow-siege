// object-pool.js - Utilitário simples de pool para reduzir GC
// createPool({ create, reset, max, prewarm })
//  pool.borrow() -> instancia (ativa)
//  pool.release(obj) -> devolve e chama reset
//  pool.stats() -> métricas

export function createPool({ create, reset, max = 512, prewarm = 0 }){
  const free = [];
  const active = new Set();
  for (let i=0;i<prewarm && i<max;i++) free.push(create());
  function borrow(){
    let obj = free.pop();
    if(!obj){ obj = create(); }
    active.add(obj);
    return obj;
  }
  function release(obj){ if(active.has(obj)){ active.delete(obj); if(free.length < max){ reset(obj); free.push(obj); } } }
  function prune(){ while(free.length > max) free.pop(); }
  function stats(){ return { free: free.length, active: active.size, max }; }
  return { borrow, release, stats, prune };
}
