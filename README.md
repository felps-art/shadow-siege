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
1. Criar `obj_controller` e estado global de jogo.
2. Adicionar `obj_nexus` (HP + perda de jogo).
3. Unificar disparo em `scr_fire_bullet` e refatorar torre/player.
4. Implementar spawner simples de waves.
5. Arpéu stub + blueprint Tesla.

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
