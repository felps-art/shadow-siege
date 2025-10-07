# Sugestões de Melhorias (Protótipo Tower Defense)

Este documento consolida as sugestões levantadas para evolução do protótipo. Agrupadas por área para facilitar priorização.

## 1. Arquitetura & Organização
- Separar em arquivos: `index.html`, `style.css`, `game.js`, módulos (`levels.js`, `entities.js`, `ui.js`).
- Classe/estrutura base `GameObject` (padronizar `update()` / `draw()`).
- Loop com delta time para independência de FPS.
- `WaveManager`, `LevelManager` e `EconomyManager` para isolar responsabilidades.
- Objeto central `CONFIG` (custos, danos, intervalos, cores, probabilidades).
- Event bus simples (`emit/subscribe`) para desacoplar UI (ex: `enemyKilled`, `waveStarted`).
- Serviços: `PersistenceService`, `AudioService`, `TooltipService`.

## 2. Performance
- Object pool para projéteis e partículas (reduz GC).
- Substituir múltiplos `setTimeout` por fila de spawn processada no loop.
- Pré-calcular vetores e comprimentos do caminho.
- Cachear gradientes por tipo (torre/inimigo).
- Spatial partition (grid ou quad-tree) para busca de alvos eficiente.
- Usar offscreen canvas para caminho e elementos estáticos.

## 3. Lógica de Jogo & Profundidade
- Sistema de upgrades (níveis de dano, alcance, efeitos especiais).
- Tipos de dano/resistência (físico, gelo, elétrico, fogo).
- Torre elétrica com chain lightning (dano decrescente por salto).
- Status adicionais: veneno (DoT), burn, stun.
- Dificuldade adaptativa conforme desempenho do jogador.
- Múltiplos caminhos por nível.
- Modo infinito após completar ondas base.

## 4. Balanceamento
- Normalizar números (ex: dano 5–50 ao invés de 100–250) para granularidade.
- Analisar DPS/custo de cada torre (planilha simples).
- Ajustar fórmula de recompensa (talvez progressiva por dificuldade/onda).
- Introduzir custo incremental para spam do mesmo tipo de torre.

## 5. UX / UI
- Pré-visualização (ghost) também no desktop.
- Tooltip e painel dinâmico ao clicar em torre (stats + upgrade + vender).
- Barra de progresso de onda / contador de inimigos restantes.
- Indicador visual de slow nos inimigos (aura azul / ícone).
- Botão "Iniciar próxima onda" com bônus por antecipação.
- Feedback sonoro (colocar, vender, impacto, vitória, chefe).
- Mini painel de performance (FPS / objetos) opcional.

## 6. Acessibilidade
- Checar contraste (WCAG) dos textos e botões.
- `aria-live` para eventos importantes (chefe, vitória, game over).
- Suporte completo a teclado (foco navegável, atalhos numéricos para seleção de torres).
- Estados de seleção não depender só de cor (usar bordas ou ícones).

## 7. Internacionalização (i18n)
- Extrair strings para dicionário (ex: `STRINGS['pt-BR']` e `STRINGS['en-US']`).
- Mecanismo simples de troca de idioma e persistência em localStorage.
- Renomear termos potencialmente sensíveis (ex: nome do boss) para algo mais neutro.

## 8. Código Limpo
- Consolidar lógica repetida de custo e criação (`createTower(tipo, x, y)`).
- Funções utilitárias: `worldFromClient(x,y)`, `canBuildAt(x,y)`, `spawnEnemy(config)`.
- Padronizar idioma (usar apenas português ou apenas inglês no código).
- Reduzir acoplamento UI ↔ lógica (separar DOM de core loop).
- Separar declaração de classes do script principal.

## 9. Persistência & Progresso
- Salvar estado completo (torres, vida, dinheiro, onda, nível atual) para continuar de verdade.
- Versão do save (`saveVersion`) para migração futura.
- Exportar/importar save (JSON) para debug.

## 10. Testes & Debug
- Modo sandbox com spawn manual (`spawn boss`, `spawn wave`).
- Flag `DEBUG` controlando logs.
- Overlay de diagnóstico (contagens de entidades, tempos médios de update/draw).
- Atalhos: `W` próxima onda, `B` boss, `G` toggle grid.

## 11. Efeitos Visuais
- Partículas diferenciadas por tipo de dano.
- Lightning animado para torre elétrica (zig-zag procedural).
- Tween de barra de vida (anima redução).
- Screen shake leve ao perder vida no objetivo.
- Sombra / oclusão suave em inimigos e torres.

## 12. Construção & Regras de Colocação
- Grid de células (ex: 40x40) para alinhamento e validação.
- Bloquear sobreposição de torres e distancia mínima do caminho.
- Realce verde/vermelho do ghost conforme validade.
- Custo de venda configurável (ex: 60% com upgrade de economia).

## 13. Escalabilidade Futura
- Migrar para ECS se tipos crescerem (Component: Position, Render, Combat, SlowEffect).
- Sistema de achievements / metas.
- Leaderboard local (tempo / eficiência / recurso sobrando).
- Editor de níveis no navegador (drag-and-drop com export JSON).

## 14. Performance Avançada
- Batch de partículas (um único path) reduz chamadas a canvas.
- Limitar efeitos densos em mobile detectando `devicePixelRatio`/capacidade.
- Adaptive quality (reduz partículas quando FPS cai abaixo de threshold).

## 15. Segurança / Robustez
- Try/catch ao redor de toda carga de save + fallback limpo.
- Sanitizar dados carregados (nunca confiar em JSON externo sem validar tipos).

## 16. Prioridade Recomendada (Roadmap Inicial)
1. Modularização + CONFIG + delta time.
2. Sistema de criação/validação de torres (ghost desktop + grid básico).
3. WaveManager + fila de spawn sem setTimeout.
4. Persistência completa de sessão.
5. Upgrades de torres + UI contextual.
6. Balance pass (DPS/custo) + ajustes de recompensas.
7. Efeitos visuais (lightning, partículas melhoradas).
8. i18n + acessibilidade.
9. Modo infinito + achievements.

## 17. API / Estrutura Sugerida (Exemplo Rápido)
```js
// game.js
import { LevelManager } from './level-manager.js';
import { WaveManager } from './wave-manager.js';
import { TowerManager } from './tower-manager.js';
import { Economy } from './economy.js';

const game = { level: new LevelManager(), wave: new WaveManager(), towers: new TowerManager(), economy: new Economy(), running: true };

function loop(ts){ requestAnimationFrame(loop); /* delta calc + update/draw */ }
requestAnimationFrame(loop);
```

---
Se quiser, posso começar a executar uma dessas etapas (ex: separar arquivos ou implementar grid de construção). Indique a prioridade e prossigo.
