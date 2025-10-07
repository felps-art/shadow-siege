# MVP – Shadow Siege (Tower Defense + Metroidvania Top-Down)

## Objetivo do MVP
Entregar um protótipo jogável que prove o loop central híbrido:
Mover (twin-stick) + Atirar + Colocar torres estratégicas + Defender um objetivo (Nexus) em ondas curtas, enquanto desbloqueia uma área usando 1 habilidade-chave de progressão (Arpéu Magnético) para acessar um blueprint de torre especial (Tesla).

## Core Loop (Versão Inicial)
1. Explorar área inicial / limpar inimigos leves.
2. Coletar gold ao eliminar inimigos.
3. Construir torres para estreitar e controlar caminhos.
4. Iniciar/sofrer uma wave automática (defesa de sala). 
5. Defender Nexus (ou ponto de energia) – se Nexus chegar a 0 HP, game over.
6. Ao explorar lateralmente, encontrar obstáculo (abismo) + obter Arpéu para acessar blueprint Tesla.
7. Construir Torre Tesla e defender uma wave mais forte para validar sinergia.

## Feature Set do MVP (Must / Should / Nice)
### Must (Obrigatório)
- Movimento 8 direções + mira independente (mouse) e disparo básico.
- Sistema de inimigos simples com waves incrementais.
- Gold e custo de torres básicas (uma torre de projétil).
- Construção de torres com verificação de posição válida e cooldown.
- HUD: HP jogador, Gold, Cooldown de construção, HP Nexus.
- Arpéu Magnético: puxa o jogador até pontos âncora (mínimo 2 no mapa).
- Obstáculo que exige o Arpéu para avançar.
- Blueprint da Torre Tesla (coletável).
- Torre Tesla funcional (dano em cadeia em até N inimigos dentro de raio).

### Should (Desejável no MVP se houver tempo)
- Labirinto / colocação de barreiras para path shaping.
- Diferentes tipos de inimigo: lento tank / rápido frágil.
- Indicador de pré-visualização da torre antes de colocar (ghost verde/vermelho).
- Game Over / Restart simples.

### Nice (Post-MVP)
- Upgrades de torre.
- Drops ocasionais de gold / energia.
- Mapa com minimapa.
- Partículas e efeitos elétricos.

## Critérios de Aceitação
- Jogador consegue enfrentar ao menos 3 waves e usar torres para vencer.
- Perde se Nexus ou HP do jogador zerar (definir se ambos ou só Nexus para teste).
- Consegue acessar área bloqueada APENAS após obter Arpéu.
- Torre Tesla claramente mais forte/estratégica que a torre padrão (ex: chain em 3 alvos, menor DPS unitário mas forte em grupos).
- FPS estável (>=60) com 30+ inimigos simultâneos no protótipo.

## Restrições & Escopo Delimitado
- Sem sistema de inventário completo (apenas flags de itens-chave).
- Sem save/load no MVP (apenas post-MVP).
- Sem pathfinding avançado (usar steering simples + contorno de barreiras/tile bloqueado). Pode evoluir para A* depois.

## Riscos Antecipados
| Risco | Mitigação |
|-------|-----------|
| Combate e defesa disputam foco demais | HUD e feedback claros + ritmo de waves separado da exploração |
| Performance com muitas checagens de colisão | Introduzir pooling e broad-phase (grid) cedo |
| Tesla overpowered | Ajustar raio/dano, limitar encadeamentos |
| Arpéu trivializa combate | Cooldown + só funciona em âncoras pré-definidas |

## Métricas a Validar no MVP
- Tempo médio até acessar a Tesla.
- Uso médio de torres por wave.
- Gold sobrando vs. custo (indicador de economia saturada ou escassa).
- Quantidade de mortes por wave.

## Próximo Passo Imediato
Documentar arquitetura técnica e iniciar implementação incremental (controller, pooling base, torre Tesla stub).
