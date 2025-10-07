// --- obj_player | Create Event ---
move_speed = 4; // Velocidade de movimento do jogador

// Recursos e construção de torre
gold = 100;         // Recursos iniciais do jogador
tower_cost = 25;    // Custo para construir uma torre
tower_cooldown = 180; // Cooldown em frames entre construções (180 = 3s a 60fps)
tower_cooldown_timer = 0; // Timer atual do cooldown
// Vida do jogador
hp = 10; // Pontos de vida do jogador