// --- obj_player | Step Event ---

// Captura a entrada do teclado
var _key_right = keyboard_check(ord("D"));
var _key_left = keyboard_check(ord("A"));
var _key_up = keyboard_check(ord("W"));
var _key_down = keyboard_check(ord("S"));

// Calcula e normaliza a direção do movimento para evitar velocidade extra na diagonal
var _h_move = _key_right - _key_left;
var _v_move = _key_down - _key_up;
var _mag = sqrt(_h_move * _h_move + _v_move * _v_move);
if (_mag > 0) {
    _h_move = _h_move / _mag;
    _v_move = _v_move / _mag;
}

// Move o personagem com velocidade constante
x += _h_move * move_speed;
y += _v_move * move_speed;

// --- obj_player | Step Event (continuação) ---

// Mira na direção do mouse
image_angle = point_direction(x, y, mouse_x, mouse_y);

// Atirar com o botão esquerdo do mouse
if (mouse_check_button_pressed(mb_left)) {
    // Cria uma instância da bala
    // Layer safe acquisition (inline to avoid missing script resource)
    var _inst_layer = "Instances";
    if (!layer_exists(_inst_layer)) { layer_create(-1, _inst_layer); }
    var _bullet = instance_create_layer(x, y, _inst_layer, obj_bullet);
    // Define a direção e velocidade da bala
    _bullet.direction = image_angle;
    _bullet.speed = 10;
}

// --- obj_player | Step Event (continuação) ---

// Construir torre com a tecla E
// Decrementa o timer do cooldown se estiver ativo
if (tower_cooldown_timer > 0) {
    tower_cooldown_timer -= 1;
}

// Construir torre com a tecla E
if (keyboard_check_pressed(ord("E"))) {
    // Verifica cooldown
    if (tower_cooldown_timer > 0) {
        // feedback: cooldown ativo (mostrado no HUD)
    }
    // Verifica recursos
    else if (gold < tower_cost) {
        // feedback: ouro insuficiente (mostrado no HUD)
    }
    // Verifica colisão no local de criação (não permite sobrepor torres ou inimigos)
    else if (place_meeting(x, y, obj_tower) || place_meeting(x, y, obj_enemy)) {
        // feedback: local ocupado (pode ser mostrado no HUD)
    }
    else {
        // Cria a torre, debita custo e inicia cooldown
    var _layer2 = "Instances";
    if (!layer_exists(_layer2)) { layer_create(-1, _layer2); }
    instance_create_layer(x, y, _layer2, obj_tower);
        gold -= tower_cost;
        tower_cooldown_timer = tower_cooldown;
        // feedback: torre construída (HUD atualizará gold)
    }
}