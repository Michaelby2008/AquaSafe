import { Component, computed, input } from '@angular/core';
import { ETIQUETA_ESTADO, ETIQUETA_GRAVEDAD } from '../../core/utils/etiquetas';

@Component({
  selector: 'app-etiqueta',
  templateUrl: './etiqueta.html',
  styleUrl: './etiqueta.scss',
})
export class Etiqueta {
  tipo = input.required<'estado' | 'gravedad'>();
  valor = input.required<string>();

  info = computed(() => {
    const mapa = this.tipo() === 'estado' ? ETIQUETA_ESTADO : ETIQUETA_GRAVEDAD;
    return mapa[this.valor()] ?? { texto: this.valor(), clase: 'badge-neutral' };
  });
}