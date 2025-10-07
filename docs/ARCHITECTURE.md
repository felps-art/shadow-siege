# Arquitetura Técnica – Shadow Siege

## Visão Geral
Mistura de ação top-down (player ativo) com Tower Defense e gating estilo Metroidvania. O design privilegia modularidade: cada sistema encapsulado com scripts utilitários e objetos controladores.

## Principais Objetos (Objetos Ativos)
| Objeto | Função | Observações |
|--------|--------|-------------|
| `obj_player` | Movimento, tiro, interação | Gerencia input e habilitações (arpéu, etc.) |
| `obj_enemy` | Inimigos base (FSM) | Variantes via herança ou parâmetros |
| `obj_enemy_spawner` | Gera waves e escalonamento | Configurável por sala ou global |
| `obj_bullet` | Projéteis jogador/torres | Ideal unificar e usar pool |
| `obj_tower_basic` | Torre projétil | Range, fire_rate, upgrade hooks |
| `obj_tower_tesla` | Torre chain lightning | Requer blueprint flag global |
| `obj_barrier` | Bloco colocável (maze) | Opcional no MVP inicial |
| `obj_anchor` | Ponto de arpéu | Lista global para lookup rápido |
| `obj_nexus` | Objetivo a defender | HP, eventos de derrota |
| `obj_controller` | Orquestra (tempo, flags, aquisição de itens) | Singleton |
| `obj_hud` | Render de UI | Só desenha, sem lógica |
| `obj_loot_gold` | Drop opcional | Post-MVP ou se necessário ajuste econômico |

## Scripts (Funções Reutilizáveis)
| Script | Responsabilidade |
|--------|------------------|
| `scr_spawn_enemy(type, x, y)` | Cria inimigo configurado |
| `scr_enemy_take_damage(enemy, amount)` | Dano e efeitos |
| `scr_chain_lightning(origin, max_targets, range, damage)` | Lógica da Tesla |
| `scr_can_place_tower(x, y)` | Valida posição (colisão, path) |
| `scr_place_tower(type, x, y)` | Constrói e debita custo |
| `scr_get_player()` | Retorna referência segura ao player |
| `scr_fire_bullet(x, y, dir, speed, damage, owner)` | Unifica tiro |
| `scr_try_grapple()` | Lógica do arpéu |
| `scr_distance_sq(a, b)` | Fun util. (evitar sqrt) |
| `scr_wave_start()` | Inicia wave e ajusta estado |
| `scr_wave_config(level)` | Retorna struct de config de wave |

## Estruturas de Dados
- Structs para definir torres: `{ name, cost, range, fire_rate, damage, special }`.
- Array ou ds_grid para mapa de obstáculos (caso precise de pathfinding futuro).
- `global.flags` (struct) para itens-chave: `global.flags = { has_grapple: false, has_tesla: false }`.
- Pool de projéteis: array + índice livre.

## Estados Globais
`global.game_state`: `explore`, `defense`, `paused`.
`global.wave_number`: controla progressão.
`global.difficulty_scale`: fator multiplicador de HP/dano inimigo.

## Fluxo de Uma Wave
1. Controller detecta trigger (entrada em sala ou coleta blueprint).
2. Chama `scr_wave_start()` -> gera lista de spawns (tempo relativo + tipo).
3. Durante Step do spawner: instancia inimigos no timing correto.
4. Quando lista vazia e não há inimigos -> wave concluída -> recompensa.

## Grapple (Arpéu)
- Ativado por tecla (ex: Right Mouse / Shift / G).
- Seleciona `obj_anchor` mais próximo dentro de `grapple_range` na direção do mouse.
- Move o player em interpolação (ou define velocidade) até o ponto; durante movimento, bloqueia tiro/torre.

## Torre Tesla – Chain Lightning (Simplificado)
1. Torre adquire alvo primário (instância mais próxima dentro de `range`).
2. Aplica dano e armazena alvo em lista.
3. Enquanto lista tiver espaço (< max_targets): procura inimigo mais próximo do último atingido dentro de `jump_range` que não esteja na lista.
4. Cria efeitos (raios) e aplica dano reduzido (ex: 100%, 70%, 50%).

## Pooling de Projéteis (Estratégia)
- Manter um array `bullet_pool` de tamanho fixo (ex: 128).
- Cada slot: `{active, x, y, dir, speed, damage, owner}`.
- Step global atualiza ativos; colisão checada via simples AABB/circle + fallback colisão GM nativa somente se perto do alvo.

## Otimização Inicial
- Evitar `instance_nearest` frequente: cache inimigos em uma lista no controller se necessário.
- Usar distância ao quadrado (`dist_sq`) para comparações de proximidade.
- Desenhos de HUD isolados no Draw GUI event (pode migrar depois).

## Eventos por Objeto (Resumo)
`obj_player`: Create (vars), Step (input + estados), Draw GUI (retícula optional).
`obj_controller`: Create (flags, wave vars), Step (FSM global), Alarm/Timers.
`obj_enemy_spawner`: Step (spawn schedule), Destroy (limpar refs).
`obj_tower_*`: Step (aquisição alvo + disparo), Draw (indicadores range if selecionada).
`obj_hud`: Draw GUI.

## Erros a Evitar
- Sobrecarregar Step do player com lógica global.
- Recalcular range de Tesla com listas de inimigos a cada frame sem limite.
- Usar `instance_create_layer` sem controle -> memory churn (use pooling quando escalar).

## Evoluções Futuras
- Sistema de upgrades via structs + aplicação incremental.
- Pathfinding A* com grid marcando torres/barreiras.
- Editor de salas baseado em naming de layers (ex: `Anchors`, `Spawns`, `Blocks`).
