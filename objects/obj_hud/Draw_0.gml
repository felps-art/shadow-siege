// --- obj_hud | Draw Event ---
// Desenha HUD simples: HP, Gold e barra de cooldown de construção

// Obtém referências seguras ao jogador
if (!instance_exists(obj_player)) exit;
var p = instance_find(obj_player, 0);
if (p == noone) exit;

// Posições básicas
var margin = 8;
var x_base = margin;
var y_base = margin;

// HP
var hp_text = "HP: " + string(p.hp);
draw_set_color(c_white);
draw_text(x_base, y_base, hp_text);

// Gold
var gold_text = "Gold: " + string(p.gold);
draw_text(x_base, y_base + 16, gold_text);

// Cooldown bar
var bar_x = x_base;
var bar_y = y_base + 36;
var bar_w = 120;
var bar_h = 10;

var cooldown_ratio = clamp(p.tower_cooldown_timer / max(1, p.tower_cooldown), 0, 1);
// Fundo da barra
draw_set_color(make_color_rgb(50, 50, 50));
draw_rectangle(bar_x, bar_y, bar_x + bar_w, bar_y + bar_h, false);
// Barra preenchida (inverte: quando timer=0, ratio=0)
draw_set_color(make_color_rgb(100, 200, 100));
draw_rectangle(bar_x, bar_y, bar_x + (bar_w * (1 - cooldown_ratio)), bar_y + bar_h, false);

// Texto da barra
draw_set_color(c_white);
draw_text(bar_x + bar_w + 6, bar_y - 2, "Build Cooldown");
