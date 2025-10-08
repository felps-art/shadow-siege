// spatial-index.js - Estrutura de índice espacial simples (hash de células) para acelerar busca de inimigos em raio.
// Evita varrer todos os inimigos para cada torre; custo médio próximo ao número real de vizinhos.

export class SpatialHash {
  constructor(cellSize=80){
    this.cellSize = cellSize;
    this.map = new Map(); // key -> array de objetos
    this.count = 0;
  }
  _key(cx, cy){ return cx+','+cy; }
  clear(){ this.map.clear(); this.count=0; }
  insert(obj){
    const cx = Math.floor(obj.x / this.cellSize); const cy = Math.floor(obj.y / this.cellSize);
    const key = this._key(cx,cy);
    let arr = this.map.get(key); if(!arr){ arr=[]; this.map.set(key, arr); }
    arr.push(obj); this.count++;
  }
  // Retorna candidatos dentro de um círculo aproximado
  queryCircle(x, y, r){
    const cs = this.cellSize; const minCx = Math.floor((x - r)/cs); const maxCx = Math.floor((x + r)/cs);
    const minCy = Math.floor((y - r)/cs); const maxCy = Math.floor((y + r)/cs);
    const out = [];
    for(let cy=minCy; cy<=maxCy; cy++){
      for(let cx=minCx; cx<=maxCx; cx++){
        const arr = this.map.get(this._key(cx,cy)); if(!arr) continue;
        for(const obj of arr){ out.push(obj); }
      }
    }
    return out;
  }
  debugStats(){ return { buckets: this.map.size, objects: this.count, avgPerBucket: this.map.size? (this.count/this.map.size).toFixed(2):0 }; }
}
