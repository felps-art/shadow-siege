// --- obj_enemy | Step Event (refactor) ---

// 1. Morte
if (!is_dying && hp <= 0) {
    is_dying = true;
    // Recompensa
    if (instance_exists(obj_player)) {
        var _p = instance_find(obj_player, 0);
        if (_p != noone && variable_instance_exists(_p, "gold")) {
            _p.gold += gold_reward;
        }
    }
    instance_destroy();
    exit;
}

// 2. Timers
if (attack_timer > 0) attack_timer--;
if (hit_flash_timer > 0) hit_flash_timer--;

// 3. Aquisição de alvo (player > nexus)
target_id = noone;
target_kind = -1;

var _player = noone;
if (instance_exists(obj_player)) {
    _player = instance_nearest(x, y, obj_player);
    if (_player != noone) {
    var dxp = _player.x - x; var dyp = _player.y - y; var d2p = dxp*dxp + dyp*dyp;
    if (d2p <= aggro_range * aggro_range) {
            target_id = _player; target_kind = 0;
        }
    }
}
if (target_id == noone) {
    var _nexus_index = asset_get_index("obj_nexus");
    if (_nexus_index != -1 && instance_exists(_nexus_index)) {
        var _nx = instance_nearest(x, y, _nexus_index);
        if (_nx != noone) { target_id = _nx; target_kind = 1; }
    }
}

// 4. FSM
// Pré-calcula distância ao alvo se existir
// Valores sentinela grandes (evita possível problema de parser com notação científica em algumas builds)
var dist2_target = 1000000000; // ~1e9
var dist_target = 1000000000;
var tx, ty;
if (target_id != noone) {
    tx = target_id.x; ty = target_id.y;
    var dx = tx - x; var dy = ty - y;
    dist2_target = dx*dx + dy*dy;
    // Só converte para raiz quando necessário (ataque)
    if (dist2_target < 262144) dist_target = sqrt(dist2_target); // sqrt só se n<512 px
}

switch (state) {
    case 0: // PATROL
    {
        patrol_time++;
        patrol_retarget_timer++;
        // Retarget ou chegou
        if (point_distance(x, y, patrol_target_x, patrol_target_y) < 6 || patrol_retarget_timer >= patrol_retarget_interval) {
            patrol_retarget_timer = 0;
            var ang = irandom_range(0, 359);
            patrol_target_x = patrol_center_x + lengthdir_x(irandom_range(16, patrol_radius), ang);
            patrol_target_y = patrol_center_y + lengthdir_y(irandom_range(16, patrol_radius), ang);
        }
        // Move
        move_towards_point(patrol_target_x, patrol_target_y, speed);
        // Transição para chase
        if (target_id != noone && (target_kind == 1 || dist2_target <= aggro_range * aggro_range)) {
            if (target_kind == 0 && patrol_time < patrol_min_time && dist2_target > attack_range * attack_range) {
                // respeita tempo mínimo se player longe do ataque
            } else {
                state = 1; patrol_time = 0;
            }
        }
        break;
    }
    case 1: // CHASE
    {
        if (target_id == noone) { state = 0; break; }
        move_towards_point(tx, ty, speed);
        // Player saiu do aggro (só para player)
    var _agg_out = aggro_range * 1.25; if (target_kind == 0 && dist2_target > _agg_out * _agg_out) { state = 0; patrol_time = 0; break; }
        // Entrou no range de ataque
    if (dist2_target <= attack_range * attack_range) { state = 2; }
        break;
    }
    case 2: // ATTACK
    {
        if (target_id == noone) { state = 0; break; }
    var _atk_out = attack_range * 1.15; if (dist2_target > _atk_out * _atk_out) { state = 1; break; }
        if (attack_timer <= 0) {
            if (variable_instance_exists(target_id, "hp")) {
                target_id.hp -= damage;
                if (target_kind == 0) {
                    var kdir = point_direction(x, y, target_id.x, target_id.y);
                    target_id.x += lengthdir_x(knockback_force, kdir);
                    target_id.y += lengthdir_y(knockback_force, kdir);
                }
            }
            attack_timer = attack_cooldown;
        }
        break;
    }
}

// 5. Separação simples (executa a cada separation_interval frames) — robusta sem with()
if (separation_enabled) {
    separation_timer++;
    if (separation_timer >= separation_interval) {
        separation_timer = 0;
        var cnt = instance_number(obj_enemy);
        if (cnt > 1) {
            push_x = 0; push_y = 0;
            // Coleta ids via instance_find (compatível) evitando dependência de instance_first/next
            var list = ds_list_create();
            var idx = 0;
            while (true) {
                var inst = instance_find(obj_enemy, idx);
                if (inst == noone) break;
                ds_list_add(list, inst);
                idx++;
            }
            // Itera e acumula forças
            var my_sep_r2 = separation_radius * separation_radius;
            for (var i = 0; i < ds_list_size(list); i++) {
                var e = list[| i];
                if (e == id || !instance_exists(e)) continue;
                var dxs = e.x - x; var dys = e.y - y;
                var d2 = dxs*dxs + dys*dys;
                if (d2 > 0 && d2 < my_sep_r2) {
                    var d = sqrt(d2);
                    var f = (1 - (d / separation_radius)) * separation_strength;
                    push_x += (dxs / d) * f;
                    push_y += (dys / d) * f;
                }
            }
            ds_list_destroy(list);
            var mag = point_distance(0, 0, push_x, push_y);
            if (mag > 0) {
                var maxp = separation_max_push; if (state == 2) maxp *= 0.4;
                var s = min(maxp, mag) / mag;
                x += push_x * s;
                y += push_y * s;
            }
        }
    }
}

// 6. Contenção room
var _m = boundary_margin;
if (x < _m) x = _m; else if (x > room_width - _m) x = room_width - _m;
if (y < _m) y = _m; else if (y > room_height - _m) y = room_height - _m;