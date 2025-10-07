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

// --- Seleção de alvo (player prioritário dentro do aggro; caso contrário nexus) ---
var target_inst = noone;
var target_type = -1; // 0 = player, 1 = nexus
var target_player = noone;
var target_nexus = noone;
var dist_to_player = 999999;
var dist_to_nexus = 999999;

if (instance_exists(obj_player)) {
    // Caso haja múltiplos jogadores no futuro, pegar o mais próximo
    target_player = instance_nearest(x, y, obj_player);
    dist_to_player = point_distance(x, y, target_player.x, target_player.y);
}
if (instance_exists(obj_nexus)) {
    target_nexus = instance_nearest(x, y, obj_nexus); // normalmente 1
    dist_to_nexus = point_distance(x, y, target_nexus.x, target_nexus.y);
}

if (target_player != noone && dist_to_player <= aggro_range) {
    target_inst = target_player;
    target_type = 0;
} else if (target_nexus != noone) {
    target_inst = target_nexus;
    target_type = 1;
}

if (target_inst == noone) {
    // Sem alvo -> patrulha
    state = 0;
} else {
    var px = target_inst.x;
    var py = target_inst.y;
    var dist_to_target = point_distance(x, y, px, py);

    // Transições de estado
    switch (state) {
        case 0: // Patrol (ou transição imediata para nexus se for o alvo)
        {
            // Se o alvo é o nexus, não ficar patrulhando: ir direto perseguir
            if (target_type == 1) { state = 1; break; }
            // Incrementa tempo de patrulha
            patrol_time += 1;
            patrol_retarget_timer += 1;

            // Se jogador é alvo e está dentro do alcance de ataque, pode quebrar a patrulha imediatamente
            if (target_type == 0 && dist_to_target <= attack_range) { state = 1; patrol_time = 0; break; }
            // Caso contrário só persegue se tempo mínimo já passou E está no aggro
            if (target_type == 0 && patrol_time >= patrol_min_time && dist_to_target <= aggro_range) { state = 1; patrol_time = 0; break; }

            // Se não há um target de patrulha definido ou chegou, escolhe novo ponto
            if (point_distance(x, y, patrol_target_x, patrol_target_y) < 4) {
                var angle = irandom_range(0, 359);
                patrol_target_x = patrol_center_x + lengthdir_x(irandom_range(16, patrol_radius), angle);
                patrol_target_y = patrol_center_y + lengthdir_y(irandom_range(16, patrol_radius), angle);
                patrol_retarget_timer = 0;
            }

            // Retarget forçado se demorou demais sem chegar
            if (patrol_retarget_timer >= patrol_retarget_interval) {
                patrol_retarget_timer = 0;
                var angle2 = irandom_range(0, 359);
                patrol_target_x = patrol_center_x + lengthdir_x(irandom_range(16, patrol_radius), angle2);
                patrol_target_y = patrol_center_y + lengthdir_y(irandom_range(16, patrol_radius), angle2);
            }

            // Move em direção ao ponto de patrulha
            move_towards_point(patrol_target_x, patrol_target_y, speed);
            break;
        }
        case 1: // Chase (player ou nexus)
        {
            // Só aplicável se alvo é jogador: saiu do aggro -> volta a patrulhar
            if (target_type == 0 && dist_to_target > aggro_range * 1.2) { state = 0; patrol_time = 0; break; }

            // Se dentro do range de ataque
            if (dist_to_target <= attack_range) { state = 2; break; }

            // Persegue alvo atual (player ou nexus)
            move_towards_point(px, py, speed);
            break;
        }
        case 2: // Attack
        {
            // Se alvo saiu do alcance de ataque, volta para chase
            if (dist_to_target > attack_range) { state = 1; break; }

            // Tenta atacar somente se cooldown zerado
            if (attack_timer <= 0) {
                // Aplica dano a qualquer alvo com HP (player ou nexus)
                if (target_inst != noone && variable_instance_exists(target_inst, "hp")) {
                    target_inst.hp -= damage;
                    // Knockback somente em player
                    if (target_type == 0) {
                        var kb_dir = point_direction(x, y, target_inst.x, target_inst.y);
                        target_inst.x += lengthdir_x(knockback_force, kb_dir);
                        target_inst.y += lengthdir_y(knockback_force, kb_dir);
                    }
                }
                attack_timer = attack_cooldown;
            }

            break;
        }
    }
}

// --- Separação / Evitar sobreposição entre inimigos ---
// Incremento do timer sem operador 'mod' (compatibilidade)
if (separation_interval > 1) {
    separation_timer += 1;
    if (separation_timer >= separation_interval) separation_timer = 0;
} else {
    separation_timer = 0;
}

if (separation_timer == 0) {
    if (instance_number(obj_enemy) > 1) {
        // Zera acumuladores desta instância
        push_x = 0;
        push_y = 0;
        // Percorre outras instâncias e calcula força afastando do centro de cada uma
        with (obj_enemy) {
            if (id != other.id) {
                var dx = other.x - x;
                var dy = other.y - y;
                var dist = point_distance(other.x, other.y, x, y);
                if (dist > 0 && dist < other.separation_radius) {
                    var f = (1 - (dist / other.separation_radius)) * other.separation_strength;
                    // Direção normalizada afastando (invertida relative ao outro)
                    other.push_x += (dx / dist) * f;
                    other.push_y += (dy / dist) * f;
                }
            }
        }
        var mag = point_distance(0, 0, push_x, push_y);
        if (mag > 0) {
            var max_push_local = separation_max_push;
            // Enquanto atacando, reduzir deslocamento para não deslizar demais
            if (state == 2) max_push_local *= 0.4;
            var scale = min(max_push_local, mag) / mag;
            x += push_x * scale;
            y += push_y * scale;
        }
    }
}