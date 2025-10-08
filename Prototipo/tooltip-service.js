// tooltip-service.js - abstrai lógica de tooltip baseada em hover/foco
// Permite troca futura por componente custom sem tocar game/ui core.

import { tooltipShow, tooltipHide } from './ui.js';
import { tooltipFromTowerKey } from './config.js';

export class TooltipService {
  constructor(elements){
    this.elements = elements;
    this.bound = new Map();
  }
  bindTowerButton(key, btn){
    if(!btn) return; const enter = ()=> tooltipShow(this.elements, tooltipFromTowerKey(key), btn);
    const leave = ()=> tooltipHide(this.elements);
    btn.addEventListener('mouseenter', enter); btn.addEventListener('mouseleave', leave);
    btn.addEventListener('focus', enter); btn.addEventListener('blur', leave);
    this.bound.set(btn, { enter, leave });
  }
  unbindAll(){ for (const [btn,{enter,leave}] of this.bound.entries()){ btn.removeEventListener('mouseenter', enter); btn.removeEventListener('mouseleave', leave); btn.removeEventListener('focus', enter); btn.removeEventListener('blur', leave); } this.bound.clear(); }
}
