// path-utils.js - Pré-cálculo de segmentos do caminho para reduzir computação por frame.
// Gera vetor de segmentos com delta, comprimento e normalizados, além de comprimento cumulativo.
export function precomputePath(points){
  const segments = [];
  let cumulative = 0;
  for (let i=0;i<points.length-1;i++){
    const a = points[i]; const b = points[i+1];
    const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.hypot(dx, dy) || 0.00001; // evita divisão por zero
    const nx = dx / length; const ny = dy / length;
    segments.push({ a, b, dx, dy, length, nx, ny, start:cumulative, end: cumulative + length });
    cumulative += length;
  }
  return { segments, totalLength: cumulative };
}
