import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ReporteDetalle as ReporteDatos } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { mensajeError } from '../../../core/utils/errores';
import { ConfirmarDialogo } from '../../../shared/confirmar-dialogo/confirmar-dialogo';
import { Etiqueta } from '../../../shared/etiqueta/etiqueta';

@Component({
  selector: 'app-reporte-detalle',
  imports: [RouterLink, DatePipe, Etiqueta, ConfirmarDialogo],
  templateUrl: './reporte-detalle.html',
  styleUrl: './reporte-detalle.scss',
})
export class ReporteDetalle {
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  private reportes = inject(ReportesService);
  auth = inject(AuthService);

  readonly id = Number(this.ruta.snapshot.paramMap.get('id'));

  reporte = signal<ReporteDatos | null>(null);
  cargando = signal(true);
  errorCarga = signal('');
  errorAccion = signal('');
  exito = signal<string>(history.state?.exito ?? '');
  dialogoAbierto = signal(false);
  eliminando = signal(false);

  puedeEditar = computed(() => {
    const r = this.reporte();
    return !!r && (this.auth.esAdmin() || r.estado === 'pendiente');
  });

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.reportes.obtener(this.id).subscribe({
      next: (r) => {
        this.reporte.set(r);
        this.cargando.set(false);
      },
      error: (e) => {
        this.errorCarga.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  urlFoto(ruta: string) {
    return `${environment.apiUrl}/uploads/${ruta}`;
  }

  urlMapa(r: ReporteDatos) {
    return `https://www.openstreetmap.org/?mlat=${r.latitud}&mlon=${r.longitud}#map=17/${r.latitud}/${r.longitud}`;
  }

  eliminar() {
    this.eliminando.set(true);
    this.reportes.eliminar(this.id).subscribe({
      next: () => this.router.navigate(['/reportes'], { state: { exito: 'Reporte eliminado correctamente' } }),
      error: (e) => {
        this.dialogoAbierto.set(false);
        this.eliminando.set(false);
        this.errorAccion.set(mensajeError(e));
      },
    });
  }
}