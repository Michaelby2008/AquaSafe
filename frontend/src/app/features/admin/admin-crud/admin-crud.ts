import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, debounceTime } from 'rxjs';
import { Paginado, Zona } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogosService, Recurso } from '../../../core/services/catalogos.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { mensajeError } from '../../../core/utils/errores';
import { mensajeControl } from '../../../core/utils/formularios';
import { ConfirmarDialogo } from '../../../shared/confirmar-dialogo/confirmar-dialogo';
import { CONFIGS, CampoConfig, ClaveCrud, ColumnaConfig, CrudConfig, OpcionSelect } from '../admin.config';

type Fila = Record<string, unknown> & { id: number };
type Valor = string | boolean | null;

@Component({
  selector: 'app-admin-crud',
  imports: [ReactiveFormsModule, DatePipe, ConfirmarDialogo],
  templateUrl: './admin-crud.html',
  styleUrl: './admin-crud.scss',
})
export class AdminCrud {
  private ruta = inject(ActivatedRoute);
  private catalogos = inject(CatalogosService);
  private usuarios = inject(UsuariosService);
  private auth = inject(AuthService);

  readonly mensajeControl = mensajeControl;
  readonly limite = 10;

  readonly config: CrudConfig = CONFIGS[this.ruta.snapshot.data['crud'] as ClaveCrud];

  datos = signal<Paginado<Fila> | null>(null);
  cargando = signal(true);
  error = signal('');        // falla al cargar la lista
  errorAccion = signal('');  // falla al eliminar
  exito = signal('');
  page = signal(1);
  busqueda = new FormControl('', { nonNullable: true });

  // Formulario (crear o editar)
  formAbierto = signal(false);
  editando = signal<Fila | null>(null);
  guardando = signal(false);
  errorForm = signal('');
  form = new FormGroup<Record<string, FormControl<Valor>>>({});

  // Eliminar
  filaAEliminar = signal<Fila | null>(null);
  eliminando = signal(false);

  // Zonas: sirven para el select de cuadrillas y para mostrar el nombre de la zona en la tabla
  zonas = signal<Zona[]>([]);
  zonasPorId = computed(() => new Map(this.zonas().map((z) => [z.id, z.nombre])));

  totalPaginas = computed(() => {
    const d = this.datos();
    return d ? Math.max(1, Math.ceil(d.total / d.limit)) : 1;
  });

  private peticion?: Subscription;

  constructor() {
    if (this.necesitaZonas()) {
      this.catalogos.listar<Zona>('zonas', { limit: 50 }).subscribe({ next: (r) => this.zonas.set(r.data) });
    }

    // Al escribir en el buscador vuelve a la página 1 (espera 400 ms)
    this.busqueda.valueChanges.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.cargar();
    });

    this.cargar();
  }

  private necesitaZonas() {
    return (
      this.config.columnas.some((c) => c.tipo === 'zona') ||
      this.config.campos.some((c) => c.opciones === 'zonas')
    );
  }

  // ===== Lista =====

  cargar() {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    const filtros = { q: this.busqueda.value.trim(), page: this.page(), limit: this.limite };
    const origen: Observable<Paginado<unknown>> =
      this.config.origen === 'usuarios'
        ? this.usuarios.listar(filtros)
        : this.catalogos.listar(this.config.clave as Recurso, filtros);

    this.peticion = origen.subscribe({
      next: (r) => {
        // Si se eliminó el último registro de la página, retrocede una
        if (r.data.length === 0 && this.page() > 1) {
          this.page.update((p) => p - 1);
          this.cargar();
          return;
        }
        this.datos.set(r as Paginado<Fila>);
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

  // ===== Celdas =====

  texto(fila: Fila, col: ColumnaConfig): string {
    const v = fila[col.clave];
    switch (col.tipo) {
      case 'bool':
        return v ? 'Sí' : 'No';
      case 'rol':
        return v === 'administrador' ? 'Administrador' : 'Ciudadano';
      case 'zona':
        return v == null ? 'Sin zona' : (this.zonasPorId().get(Number(v)) ?? `Zona ${v}`);
      default:
        return v === null || v === undefined || v === '' ? '—' : String(v);
    }
  }

  get nuevo(): string {
    return this.config.genero === 'f' ? 'Nueva' : 'Nuevo';
  }

  nombreDe(fila: Fila): string {
    return String(fila[this.config.campoNombre] ?? '');
  }

  // Un administrador no puede modificar su propio usuario (el backend lo rechaza)
  esPropio(fila: Fila): boolean {
    return this.config.origen === 'usuarios' && fila.id === this.auth.usuario()?.id;
  }

  opcionesDe(campo: CampoConfig): OpcionSelect[] {
    if (campo.opciones === 'zonas') return this.zonas().map((z) => ({ valor: String(z.id), texto: z.nombre }));
    return campo.opciones ?? [];
  }

  // ===== Formulario =====

  private construirForm(fila: Fila | null) {
    const controles: Record<string, FormControl<Valor>> = {};
    for (const campo of this.config.campos) {
      const validadores: ValidatorFn[] = [];
      if (campo.requerido) validadores.push(Validators.required);
      if (campo.min) validadores.push(Validators.minLength(campo.min));
      if (campo.max) validadores.push(Validators.maxLength(campo.max));
      controles[campo.clave] = new FormControl<Valor>(this.valorInicial(campo, fila), validadores);
    }
    this.form = new FormGroup(controles);
  }

  private valorInicial(campo: CampoConfig, fila: Fila | null): Valor {
    if (!fila) return campo.tipo === 'checkbox' ? Boolean(campo.valorInicial) : String(campo.valorInicial ?? '');
    const v = fila[campo.clave];
    if (campo.tipo === 'checkbox') return !!v; // MySQL devuelve 0 o 1
    return v === null || v === undefined ? '' : String(v);
  }

  abrirCrear() {
    this.errorAccion.set('');
    this.editando.set(null);
    this.construirForm(null);
    this.errorForm.set('');
    this.exito.set('');
    this.formAbierto.set(true);
  }

  abrirEditar(fila: Fila) {
    this.errorAccion.set('');
    this.editando.set(fila);
    this.construirForm(fila);
    this.errorForm.set('');
    this.exito.set('');
    this.formAbierto.set(true);
  }

  cerrarForm() {
    this.formAbierto.set(false);
    this.editando.set(null);
  }

  // Convierte los valores del formulario al cuerpo que espera cada endpoint
  private cuerpo(): Record<string, unknown> {
    const salida: Record<string, unknown> = {};
    for (const campo of this.config.campos) {
      const v = this.form.controls[campo.clave].value;
      if (campo.tipo === 'checkbox') {
        salida[campo.clave] = !!v;
      } else if (campo.tipo === 'select' && campo.opciones === 'zonas') {
        salida[campo.clave] = v === '' || v === null ? null : Number(v);
      } else {
        // Los textos opcionales vacíos se envían como '' para que también sirvan al editar
        salida[campo.clave] = String(v ?? '').trim();
      }
    }
    return salida;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const fila = this.editando();
    const cuerpo = this.cuerpo();
    this.guardando.set(true);
    this.errorForm.set('');

    let operacion: Observable<unknown>;
    if (this.config.origen === 'usuarios') {
      operacion = this.usuarios.actualizar(fila!.id, cuerpo as { rol: 'ciudadano' | 'administrador'; activo: boolean });
    } else if (fila) {
      operacion = this.catalogos.actualizar(this.config.clave as Recurso, fila.id, cuerpo);
    } else {
      operacion = this.catalogos.crear(this.config.clave as Recurso, cuerpo);
    }

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.exito.set(this.mensajeExito(fila ? 'actualizado' : 'creado'));
        this.cerrarForm();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e));
      },
    });
  }

  // ===== Eliminar =====

  confirmarEliminar() {
    const fila = this.filaAEliminar();
    if (!fila) return;
    this.eliminando.set(true);
    this.errorAccion.set('');
    this.catalogos.eliminar(this.config.clave as Recurso, fila.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.filaAEliminar.set(null);
        this.exito.set(this.mensajeExito('eliminado'));
        this.cargar();
      },
      error: (e) => {
        this.eliminando.set(false);
        this.filaAEliminar.set(null);
        this.errorAccion.set(mensajeError(e));
      },
    });
  }

  private mensajeExito(accion: 'creado' | 'actualizado' | 'eliminado'): string {
    const f = this.config.genero === 'f';
    const participio = f ? accion.replace(/o$/, 'a') : accion;
    const sujeto = this.config.singular.charAt(0).toUpperCase() + this.config.singular.slice(1);
    return `${sujeto} ${participio} correctamente`;
  }
}
