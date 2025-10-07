// --- obj_enemy | Create Event ---
hp = 3;          // Pontos de vida
speed = 2;       // Velocidade de movimento

// State machine: 0 = patrol, 1 = chase, 2 = attack
state = 0;

// Patrulha: define um ponto central e raio (pode ser o ponto de criação)
patrol_center_x = x;
patrol_center_y = y;
patrol_radius = 100;
patrol_target_x = x;
patrol_target_y = y;

// Ranges
aggro_range = 200;   // distância para iniciar perseguição
attack_range = 24;   // distância para iniciar ataque (ajuste conforme sprites)

// Ataque
attack_cooldown = 60; // frames entre ataques
attack_timer = 0;
damage = 1;           // dano ao jogador por ataque
knockback_force = 6;  // força do knockback aplicado ao jogador
// Recompensa ao morrer
gold_reward = 5;
