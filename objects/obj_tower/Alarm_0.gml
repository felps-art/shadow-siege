// --- obj_tower | Alarm 0 Event ---

// Encontra o inimigo mais próximo
var _target = instance_nearest(x, y, obj_enemy);

// Se existe um alvo e ele está no alcance
if (_target != noone && distance_to_object(_target) <= range) {
    // Cria uma bala
    var _inst_layer = "Instances";
    if (!layer_exists(_inst_layer)) { layer_create(-1, _inst_layer); }
    var _bullet = instance_create_layer(x, y, _inst_layer, obj_bullet);
    // Mira a bala no alvo
    _bullet.direction = point_direction(x, y, _target.x, _target.y);
    _bullet.speed = 10;
}

// Reinicia o alarme para o próximo disparo
alarm[0] = fire_rate;
