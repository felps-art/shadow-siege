// --- obj_enemy | Step Event ---

// Se a vida chegar a zero, dá recompensa ao jogador (se existir) e destrói o inimigo
if (hp <= 0) {
    if (instance_exists(obj_player)) {
        var _p = instance_find(obj_player, 0);
        if (_p != noone && variable_instance_exists(_p, "gold")) {
            _p.gold += gold_reward;
        }
    }
    instance_destroy();
    exit; // garante que nada mais rode
}

// Atualiza timers
if (attack_timer > 0) attack_timer -= 1;

// Verifica existência do jogador
if (!instance_exists(obj_player)) {
    // Sem jogador, permanece patrulhando
    state = 0;
} else {
    var px = obj_player.x;
    var py = obj_player.y;
    var dist_to_player = point_distance(x, y, px, py);

    // Transições de estado
    switch (state) {
        case 0: // Patrol
        {
            // Se o jogador estiver dentro do aggro, troca para chase
            if (dist_to_player <= aggro_range) {
                state = 1;
                break;
            }

            // Se não há um target de patrulha definido ou chegou, escolhe novo ponto
            if (point_distance(x, y, patrol_target_x, patrol_target_y) < 4) {
                var angle = irandom_range(0, 359);
                patrol_target_x = patrol_center_x + lengthdir_x(irandom_range(16, patrol_radius), angle);
                patrol_target_y = patrol_center_y + lengthdir_y(irandom_range(16, patrol_radius), angle);
            }

            // Move em direção ao ponto de patrulha
            move_towards_point(patrol_target_x, patrol_target_y, speed);
            break;
        }
        case 1: // Chase
        {
            // Se o jogador saiu do aggro, volta a patrulhar
            if (dist_to_player > aggro_range * 1.2) {
                state = 0;
                break;
            }

            // Se estiver dentro do range de ataque, transita para atacar
            if (dist_to_player <= attack_range) {
                state = 2;
                break;
            }

            // Persegue o jogador
            move_towards_point(px, py, speed + 0); // opcional: pode acelerar ao perseguir
            break;
        }
        case 2: // Attack
        {
            // Se o jogador se afastou do ataque, voltar para chase
            if (dist_to_player > attack_range) {
                state = 1;
                break;
            }

            // Tenta atacar somente se cooldown zerado
            if (attack_timer <= 0) {
                // Aplica dano ao jogador se a variável existir
                if (instance_exists(obj_player) && variable_instance_exists(obj_player, "hp")) {
                    obj_player.hp -= damage;
                    // Aplica knockback: empurra o jogador na direção contrária
                    var kb_dir = point_direction(x, y, obj_player.x, obj_player.y);
                    // move o jogador instantaneamente (simples) — pode ser substituído por um sistema de velocidade
                    obj_player.x += lengthdir_x(knockback_force, kb_dir);
                    obj_player.y += lengthdir_y(knockback_force, kb_dir);
                }
                attack_timer = attack_cooldown;
            }

            break;
        }
    }
}