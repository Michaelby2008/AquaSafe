import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, debounceTime } from 'rxjs';
import { Paginado, ReporteResumen, Zona } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { ESTADOS, GRAVEDADES, textoEstado, textoGravedad } from '../../../core/utils/etiquetas';
import { mensajeError } from '../../../core/utils/errores';
import { Etiqueta } from '../../../shared/etiqueta/etiqueta';

@Component({
  selector: 'app-reportes-lista',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, Etiqueta],
  templateUrl: './reportes-lista.html',
  styleUrl: './reportes-lista.scss',
})
export class ReportesLista {
  private fb = inject(FormBuilder);
  private reportes = inject(ReportesService);
  private catalogos = inject(CatalogosService);
  auth = inject(AuthService);

  readonly estados = ESTADOS;
  readonly gravedades = GRAVEDADES;
  readonly textoEstado = textoEstado;
  readonly textoGravedad = textoGravedad;
  readonly limite = 10;

  zonas = signal<Zona[]>([]);
  datos = signal<Paginado<ReporteResumen> | null>(null);
  cargando = signal(true);
  error = signal('');
  exito = signal<string>(history.state?.exito ?? '');
  page = signal(1);

  totalPaginas = computed(() => {
    const d = this.datos();
    return d ? Math.max(1, Math.ceil(d.total / d.limit)) : 1;
  });

  filtros = this.fb.nonNullable.group({
    q: [''],
    estado: [''],
    gravedad: [''],
    zona_id: [''],
    orden: ['recientes'],
  });

  private peticion?: Subscription;

  constructor() {
    this.catalogos.listar<Zona>('zonas', { limit: 50 }).subscribe({
      next: (r) => this.zonas.set(r.data),
    });

    // Al cambiar cualquier filtro, vuelve a la página 1 y busca (espera 400 ms al escribir)
    this.filtros.valueChanges.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.cargar();
    });

    this.cargar();
  }

  cargar() {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    this.peticion = this.reportes
      .listar({ ...this.filtros.getRawValue(), page: this.page(), limit: this.limite })
      .subscribe({
        next: (r) => {
          this.datos.set(r);
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }

  irAPagina(n: number) {
    this.page.set(n);
    this.cargar();
  }

  limpiar() {
    this.filtros.reset();
  }
}