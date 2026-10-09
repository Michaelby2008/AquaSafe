import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cuadrilla, Estado, ReporteDetalle as ReporteDatos } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { mensajeError } from '../../../core/utils/errores';
import { ESTADOS_ASIGNABLES, TRANSICIONES, textoEstado } from '../../../core/utils/etiquetas';
import { mensajeControl } from '../../../core/utils/formularios';
import { ConfirmarDialogo } from '../../../shared/confirmar-dialogo/confirmar-dialogo';
import { Etiqueta } from '../../../shared/etiqueta/etiqueta';

@Component({
  selector: 'app-reporte-detalle',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, Etiqueta, ConfirmarDialogo],
  templateUrl: './reporte-detalle.html',
  styleUrl: './reporte-detalle.scss',
})
export class ReporteDetalle {
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private reportes = inject(ReportesService);
  private catalogos = inject(CatalogosService);
  auth = inject(AuthService);

  readonly id = Number(this.ruta.snapshot.paramMap.get('id'));
  readonly textoEstado = textoEstado;
  readonly mensajeControl = mensajeControl;

  reporte = signal<ReporteDatos | null>(null);
  cargando = signal(true);
  errorCarga = signal('');
  errorAccion = signal('');
  exito = signal<string>(history.state?.exito ?? '');
  dialogoAbierto = signal(false);
  eliminando = signal(false);

  // Panel del administrador
  cuadrillas = signal<Cuadrilla[]>([]);
  guardando = signal(false);
  dialogoRechazo = signal(false);

  formAsignar = this.fb.group({
    cuadrilla_id: this.fb.control<number | null>(null, Validators.required),
    notas: this.fb.nonNullable.control('', Validators.maxLength(255)),
  });

  formEstado = this.fb.group({
    estado: this.fb.control<Estado | ''>('', Validators.required),
    comentario: this.fb.nonNullable.control('', Validators.maxLength(255)),
  });

  puedeEditar = computed(() => {
    const r = this.reporte();
    return !!r && (this.auth.esAdmin() || r.estado === 'pendiente');
  });

  puedeAsignar = computed(() => {
    const r = this.reporte();
    return this.auth.esAdmin() && !!r && ESTADOS_ASIGNABLES.includes(r.estado);
  });

  estadosSiguientes = computed<Estado[]>(() => {
    const r = this.reporte();
    return this.auth.esAdmin() && r ? TRANSICIONES[r.estado] : [];
  });

  mostrarPanel = computed(() => this.puedeAsignar() || this.estadosSiguientes().length > 0);

  // Solo cuadrillas libres; las de la zona del reporte van primero
  cuadrillasDisponibles = computed(() => {
    const zona = this.reporte()?.zona_id;
    return this.cuadrillas()
      .filter((c) => !!c.disponible)
      .sort((a, b) => Number(b.zona_id === zona) - Number(a.zona_id === zona) || a.nombre.localeCompare(b.nombre));
  });

  constructor() {
    this.cargar();
    if (this.auth.esAdmin()) this.cargarCuadrillas();
  }

  cargar(mostrarSpinner = true) {
    if (mostrarSpinner) this.cargando.set(true);
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

  private cargarCuadrillas() {
    this.catalogos.listar<Cuadrilla>('cuadrillas', { limit: 50 }).subscribe({
      next: (r) => this.cuadrillas.set(r.data),
      error: (e) => this.errorAccion.set(mensajeError(e)),
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

  // ===== Panel del administrador =====

  asignar() {
    if (this.formAsignar.invalid) {
      this.formAsignar.markAllAsTouched();
      return;
    }
    const { cuadrilla_id, notas } = this.formAsignar.getRawValue();
    this.ejecutar(
      this.reportes.asignar(this.id, cuadrilla_id!, notas.trim() || undefined),
      'Cuadrilla asignada correctamente',
      () => this.formAsignar.reset({ cuadrilla_id: null, notas: '' }),
    );
  }

  // Rechazar es definitivo: pide el motivo y una confirmación
  intentarCambioEstado() {
    if (this.formEstado.invalid) {
      this.formEstado.markAllAsTouched();
      return;
    }
    const { estado, comentario } = this.formEstado.getRawValue();
    if (estado === 'rechazado') {
      if (!comentario.trim()) {
        this.formEstado.controls.comentario.setErrors({ required: true });
        this.formEstado.controls.comentario.markAsTouched();
        return;
      }
      this.dialogoRechazo.set(true);
      return;
    }
    this.aplicarCambioEstado();
  }

  aplicarCambioEstado() {
    const { estado, comentario } = this.formEstado.getRawValue();
    this.ejecutar(
      this.reportes.cambiarEstado(this.id, estado as Estado, comentario.trim() || undefined),
      `El reporte pasó a «${textoEstado(estado!)}»`,
      () => this.formEstado.reset({ estado: '', comentario: '' }),
    );
  }

  private ejecutar(operacion: Observable<{ mensaje: string }>, mensajeExito: string, alTerminar: () => void) {
    this.guardando.set(true);
    this.errorAccion.set('');
    this.exito.set('');
    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogoRechazo.set(false);
        alTerminar();
        this.exito.set(mensajeExito);
        this.cargar(false);
        this.cargarCuadrillas();
      },
      error: (e) => {
        this.guardando.set(false);
        this.dialogoRechazo.set(false);
        this.errorAccion.set(mensajeError(e));
        // Otro administrador pudo haber cambiado el reporte: se refresca para mostrar el estado real
        this.cargar(false);
        this.cargarCuadrillas();
      },
    });
  }
}
