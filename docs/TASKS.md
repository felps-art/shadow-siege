# Roadmap de Implementação (Incremental)

## Fase 1 – MVP Esqueleto
1. Controller básico (`obj_controller`) com estados `explore/defense`.
2. Nexus (`obj_nexus`) com HP e game over se <=0.
3. Player: ajustar tiro via script `scr_fire_bullet`.
4. Torre básica refatorada (usa script de disparo) + custo + cooldown + preview ghost.
5. Enemy simples + spawner com 3 waves.
6. HUD mostra HP player, HP Nexus, Gold, Wave atual.
7. Arpéu stub (teleporta até âncora para validar gating).
8. Blueprint Tesla coletável (só seta flag `has_tesla`).

## Fase 2 – Profundidade Inicial
1. Implementar Arpéu interpolado (movimento suave + cooldown).
2. Tesla funcional com chain lightning (3 saltos máximo).
3. Adicionar segunda variante de inimigo (rápido frágil).
4. Sistema de barreiras construíveis (maze) com verificação de não bloquear totalmente o caminho (heurística simples).
5. Detecção de fim de wave -> recompensas escalonadas.

## Fase 3 – Progressão Metroidvania
1. Itens-chave estruturados (`global.flags`).
2. Portas/chaves de cores, paredes quebráveis (bombas placeholder).
3. Layout de sala com gating (abismo -> arpéu; parede rachada -> bomba futura).
4. Mini-mapa simples (opcional / pós-fase se tempo).

## Fase 4 – Expansão de Torres
1. Torre Gelo (reduz speed %).
2. Torre Veneno (dano over time – DOT stack limitado).
3. Upgrades (range / fire_rate / damage) via menu simples.
4. Rebalance Tesla (dano decrescente por salto).

## Fase 5 – Polimento e Performance
1. Pool de projéteis + possíveis pools de inimigos.
2. Grid espacial ou bucketing simples para queries de proximidade.
3. Partículas básicas (impacto, eletricidade, spawn wave).
4. Sons placeholder (disparo, dano, construção, chain, arpéu). 
5. Ajustes finos: custos, dano por wave, ritmo.

## Fase 6 – Preparação de Build
1. Tela título + restart.
2. Logging de métricas (gold ganho, tempo por wave).
3. README final e changelog.
4. Lista de assets/licenças.

## Backlog Técnico / Ideias Futuras
- Modo Endless.
- Sistema de talentos do jogador (habilidades passivas).
- Coop local.
- Editor in-game de arenas.
- Eventos dinâmicos (meteor, blackout de torres, mini-boss).

## Critérios de Done (Por Fase)
- Sem erros de runtime.
- FPS estável (profiling se <55).
- Nenhuma variável crítica undefined.
- Loop testável sem intervenção manual.

## Próxima Ação Recomendada
Iniciar Fase 1: criar `obj_controller`, `obj_nexus`, scripts utilitários (`scr_get_player`, `scr_fire_bullet`).
