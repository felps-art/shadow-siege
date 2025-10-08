// --- obj_controller | Create Event ---
// Inicializa estado global simples do jogo
// Estados: 0 = BUILD/PREP, 1 = COMBAT, 2 = DEFEAT, 3 = VICTORY

if (!variable_global_exists("game")) {
    global.game = {};
}

with (global.game) {
    state = 0;           // começa em preparação
    wave = 1;            // wave atual
    wave_timer = 0;      // contador geral
    wave_cooldown = 180; // frames entre waves (placeholder)
    enemies_to_spawn = 5; // quantidade alvo na wave atual
    enemies_spawned = 0;
    enemies_alive = 0;   // atualizado no Step
}

// Parâmetros de spawn
spawn_interval = 30; // frames entre spawns durante COMBAT
spawn_timer = 0;

// Área de spawn (retângulo simples nos cantos ou aleatório)
spawn_margin = 64;

// Referência para obj_nexus (se existir no futuro)
// global.nexus_hp será lida se obj_nexus definir

