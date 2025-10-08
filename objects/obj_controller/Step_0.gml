// --- obj_controller | Step Event ---
// FSM simples: BUILD (0) -> COMBAT (1) -> (DEFEAT 2 / VICTORY 3)

if (!variable_global_exists("game")) exit;
var g = global.game;

// Atualiza contadores gerais
g.wave_timer += 1;

// Atualiza inimigos vivos (consulta direta - pode otimizar depois)
g.enemies_alive = instance_number(obj_enemy);

switch (g.state) {
    case 0: // BUILD / PREP
    {
        // Transição para COMBAT se cooldown passou ou jogador construir algo (placeholder)
        if (g.wave_timer >= g.wave_cooldown) {
            g.state = 1;
            g.wave_timer = 0;
            g.enemies_spawned = 0;
        }
        break;
    }
    case 1: // COMBAT
    {
        // Spawning incremental básico
        if (g.enemies_spawned < g.enemies_to_spawn) {
            spawn_timer -= 1;
            if (spawn_timer <= 0) {
                spawn_timer = spawn_interval;

                // Escolhe posição de spawn aleatória nas bordas
                var side = irandom(3); // 0=left 1=right 2=top 3=bottom
                var sx, sy;
                var rw = room_width;
                var rh = room_height;
                var m = spawn_margin;
                if (side == 0) { sx = m; sy = irandom_range(m, rh - m); }
                else if (side == 1) { sx = rw - m; sy = irandom_range(m, rh - m); }
                else if (side == 2) { sx = irandom_range(m, rw - m); sy = m; }
                else { sx = irandom_range(m, rw - m); sy = rh - m; }

                // Cria inimigo
                var layer_name = "Instances"; if (!layer_exists(layer_name)) layer_create(-1, layer_name);
                instance_create_layer(sx, sy, layer_name, obj_enemy);
                g.enemies_spawned += 1;
            }
        }

        // Condição de encerramento: todos spawnados e nenhum vivo
        if (g.enemies_spawned >= g.enemies_to_spawn && g.enemies_alive <= 0) {
            g.wave += 1;
            g.state = 0; // volta para preparação
            g.wave_timer = 0;
            // Escala wave: aumenta próximo alvo de inimigos
            g.enemies_to_spawn = round(g.enemies_to_spawn * 1.3 + 2);
        }

        break;
    }
    case 2: // DEFEAT
    {
        // Poderia aguardar input para reiniciar
        // Placeholder: nada
        break;
    }
    case 3: // VICTORY
    {
        // Placeholder
        break;
    }
}

// Checagem de derrota via Nexus (futura) ou player morto
if (g.state < 2) {
    // Player morto -> derrota
    if (instance_exists(obj_player)) {
        var _p = instance_find(obj_player, 0);
        if (_p != noone && variable_instance_exists(_p, "hp") && _p.hp <= 0) {
            g.state = 2;
        }
    }
    // Nexus (quando existir): se global.nexus_hp <= 0 define derrota
    if (variable_global_exists("nexus_hp") && global.nexus_hp <= 0) {
        g.state = 2;
    }
}
