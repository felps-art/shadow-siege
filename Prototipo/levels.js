// levels.js - Definição e gerenciamento de níveis

export const levels = [
  {
    name: 'Nivel 1 - Campo',
    caminho: [
      { x: 0, y: 100 }, { x: 250, y: 100 }, { x: 250, y: 400 },
      { x: 550, y: 400 }, { x: 550, y: 200 }, { x: 800, y: 200 }
    ],
    startingMoney: 200,
    maxWaves: 5
  },
  {
    name: 'Nivel 2 - Desfiladeiro',
    caminho: [
      { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 150 },
      { x: 450, y: 150 }, { x: 450, y: 450 }, { x: 800, y: 450 }
    ],
    startingMoney: 250,
    maxWaves: 6
  }
];

export function clonePath(caminho){ return caminho.map(p => ({ x:p.x, y:p.y })); }
