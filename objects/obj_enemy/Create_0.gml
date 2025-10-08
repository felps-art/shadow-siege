// --- obj_enemy | Create Event (refactor) ---
// Arquitetura data-driven simplificada para fácil extensão

// Enumerar estados (poderia virar macro global depois)
state = 0; // 0=IDLE/PATROL, 1=CHASE, 2=ATTACK, 3=STUN (reservado)

// Struct de atributos base (poderia vir de scr_enemy_config(type))
enemy_type = 0; // 0 = básico
stats = {
	hp_base: 4,
	speed: 2.0,
	damage: 1,
	aggro_range: 200,
	attack_range: 28,
	attack_cooldown: 50,
	knockback: 6,
	gold_reward: 5,
	patrol_radius: 96,
	patrol_min_time: 20,
};

// Escalonamento simples por wave (se controller existir)
var wave_mul = 1;
if (variable_global_exists("game") && is_struct(global.game)) {
	wave_mul = 1 + ((global.game.wave - 1) * 0.12); // 12% por wave
}

hp_max = round(stats.hp_base * wave_mul);
hp = hp_max;
damage = round(stats.damage * wave_mul);
speed = stats.speed;
knockback_force = stats.knockback;
aggro_range = stats.aggro_range;
attack_range = stats.attack_range;
attack_cooldown = stats.attack_cooldown;
attack_timer = irandom_range(0, attack_cooldown div 2); // desincroniza ataques
gold_reward = stats.gold_reward;

// Patrulha
patrol_center_x = x;
patrol_center_y = y;
patrol_radius = stats.patrol_radius;
patrol_target_x = x;
patrol_target_y = y;
patrol_time = 0;
patrol_min_time = stats.patrol_min_time;
patrol_retarget_timer = 0;
patrol_retarget_interval = 90;

// Vetor de movimento acumulado (para separação / empurrões futuros)
vel_x = 0;
vel_y = 0;

// Separação
separation_enabled = true;
separation_interval = 10;
separation_timer = 0;
separation_radius = 40;
separation_strength = 2;
separation_max_push = 3;
push_x = 0;
push_y = 0;

// Limites
boundary_margin = 16;

// Flags / meta
is_dying = false;
target_id = noone;
target_kind = -1; // 0=player 1=nexus

// Cooldowns auxiliares
hit_flash_timer = 0;

// Visual base (placeholder de futura modulação)
image_speed = 0;
