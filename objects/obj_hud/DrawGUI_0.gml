// --- obj_hud | Draw GUI Event ---
// HUD desenhado em coordenadas de GUI (independente da câmera)

// Referência ao player
if (!instance_exists(obj_player)) exit;
var p = instance_find(obj_player, 0); if (p == noone) exit;

// Dados globais (wave / estado) se controller existir
var wave_txt = "";
var state_txt = "";
if (variable_global_exists("game") && is_struct(global.game)) {
    wave_txt = "Wave: " + string(global.game.wave);
    var st = global.game.state;
    switch (st) {
        case 0: state_txt = "[BUILD]"; break;
        case 1: state_txt = "[COMBAT]"; break;
        case 2: state_txt = "[DEFEAT]"; break;
        case 3: state_txt = "[VICTORY]"; break;
        default: state_txt = "[???]";
    }
}

// Nexus HP (placeholder) - se existir variável global
var nexus_txt = "";
if (variable_global_exists("nexus_hp") && variable_global_exists("nexus_hp_max")) {
    nexus_txt = "Nexus: " + string(global.nexus_hp) + "/" + string(global.nexus_hp_max);
}

var margin = 12;
var line_h = 18;
var x_base = margin;
var y_base = margin;

// HP Player
var hp_text = "HP: " + string(p.hp);

// Gold
var gold_text = "Gold: " + string(p.gold);

// Cooldown bar data
var bar_w = 140;
var bar_h = 12;
var cooldown_ratio = 0;
if (p.tower_cooldown > 0) cooldown_ratio = clamp(p.tower_cooldown_timer / p.tower_cooldown, 0, 1);

// Desenho
var li = 0;

draw_set_color(c_white);
if (state_txt != "") { draw_text(x_base, y_base + line_h * li, state_txt); li++; }
if (wave_txt != "") { draw_text(x_base, y_base + line_h * li, wave_txt); li++; }
if (nexus_txt != "") { draw_text(x_base, y_base + line_h * li, nexus_txt); li++; }

draw_text(x_base, y_base + line_h * li, hp_text); li++;
draw_text(x_base, y_base + line_h * li, gold_text); li++;

// Cooldown label
draw_text(x_base, y_base + line_h * li, "Build Cooldown");
// Barra
var bar_x = x_base;
var bar_y = y_base + line_h * li + 14;

// Fundo
draw_set_color(make_color_rgb(40,40,40));
draw_rectangle(bar_x, bar_y, bar_x + bar_w, bar_y + bar_h, false);
// Preenchimento inverso
var fill_w = bar_w * (1 - cooldown_ratio);
draw_set_color(make_color_rgb(90,200,90));
draw_rectangle(bar_x, bar_y, bar_x + fill_w, bar_y + bar_h, false);

// Reset cor
draw_set_color(c_white);
