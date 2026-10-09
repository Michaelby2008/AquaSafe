import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirmar-dialogo',
  templateUrl: './confirmar-dialogo.html',
  styleUrl: './confirmar-dialogo.scss',
})
export class ConfirmarDialogo {
  abierto = input.required<boolean>();
  titulo = input('¿Estás seguro?');
  mensaje = input('Esta acción no se puede deshacer.');
  textoConfirmar = input('Eliminar');
  procesando = input(false);

  confirmar = output<void>();
  cancelar = output<void>();

  private dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const d = this.dialogo()?.nativeElement;
      if (!d) return;
      if (this.abierto() && !d.open) d.showModal();
      if (!this.abierto() && d.open) d.close();
    });
  }

  alCancelar(evento: Event) {
    evento.preventDefault();
    this.cancelar.emit();
  }
}