# Shadow Siege
Hybrid Top-Down Action + Tower Defense + Metroidvania Progression.

## Visão Geral
Shadow Siege combina combate ativo estilo twin-stick com posicionamento estratégico de torres e gating de progressão inspirado em Metroidvania/Zelda. Você explora, defende um Nexus, coleta blueprints e desbloqueia habilidades que abrem novas áreas e tipos de defesa.

## Estado Atual
- Movimento, tiro básico, construção de torre simples, HUD inicial, inimigos com FSM básica.
- Próximo passo: formalizar controller e ciclo de waves, implementar Arpéu e torre Tesla (blueprint gated).

## Core Loop (Resumo)
Explorar → Coletar recursos → Posicionar torres / preparar defesa → Enfrentar wave → Recompensa / desbloqueio → Expandir acesso ao mapa.

## Estrutura de Documentação
- `docs/MVP.md`: Escopo do MVP, critérios e riscos.
- `docs/ARCHITECTURE.md`: Objetos, scripts e estruturas de dados.
- `docs/TASKS.md`: Roadmap incremental por fases.

## Próximos Passos (Prioridade)
1. (Feito) Criar `obj_controller` e estado global de jogo. ✅
2. (Feito) Adicionar `obj_nexus` (HP + perda de jogo). ✅
3. Unificar disparo em `scr_fire_bullet` e refatorar torre/player.
4. Implementar spawner simples de waves (substituir lógica placeholder atual no controller).
5. Arpéu stub + blueprint Tesla.

### Notas sobre o `obj_controller`
Estrutura inicial criada com `global.game` contendo: `state`, `wave`, `enemies_alive`, `waves_total`, `waves_spawned`, temporizadores e FSM simples (BUILD → COMBAT → BUILD / VICTORY). O spawn atual é placeholder e deve ser migrado para um sistema de *wave definition* configurável.

### Notas sobre o `obj_nexus`
Objeto central com `hp` e `hp_max` (placeholder visual). Inimigos agora priorizam o jogador, mas recaem para atacar o nexus se o player não existir. O controller detecta `hp <= 0` e muda para `GAME_STATE_DEFEAT`. Próximos incrementos: dano escalável, upgrades defensivos e animação de destruição.

## Tecnologias / Engine
- GameMaker (GML) – foco em objetos modulares e scripts reutilizáveis.

## Convenções de Código
- Nomes de variáveis minúsculos com underscore.
- Scripts prefixados `scr_`.
- Flags globais em `global.flags`.
- Estados numéricos documentados em comentários ou migrar para enum futuramente.

## Licenciamento / Assets
Placeholder (definir antes de distribuir). Considere separar assets originais de terceiros.

## Contato / Contribuição
Projeto em estágio inicial; foco em validar core loop antes de aceitar contribuições externas.
