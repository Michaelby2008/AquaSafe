import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardData } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { mensajeError } from '../../core/utils/errores';
import { textoEstado, textoGravedad } from '../../core/utils/etiquetas';
import { Etiqueta } from '../../shared/etiqueta/etiqueta';

interface Barra {
  clave: string;
  total: number;
  porcentaje: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, Etiqueta],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private servicio = inject(DashboardService);
  auth = inject(AuthService);

  readonly textoEstado = textoEstado;
  readonly textoGravedad = textoGravedad;

  datos = signal<DashboardData | null>(null);
  cargando = signal(true);
  error = signal('');

  porEstado = computed(() => this.barras(this.datos()?.porEstado.map((e) => ({ clave: e.estado, total: e.total }))));
  porGravedad = computed(() => this.barras(this.datos()?.porGravedad.map((g) => ({ clave: g.gravedad, total: g.total }))));
  porZona = computed(() => this.barras(this.datos()?.porZona.map((z) => ({ clave: z.zona, total: z.total }))));

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.obtener().subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  // Cada barra se dibuja respecto al valor más alto de su grupo
  private barras(filas: { clave: string; total: number }[] | undefined): Barra[] {
    if (!filas?.length) return [];
    const max = Math.max(...filas.map((f) => Number(f.total)), 1);
    return filas.map((f) => ({ clave: f.clave, total: Number(f.total), porcentaje: Math.round((Number(f.total) / max) * 100) }));
  }
}
