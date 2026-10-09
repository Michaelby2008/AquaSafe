import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TipoFuga, Zona } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { GRAVEDADES, textoGravedad } from '../../../core/utils/etiquetas';
import { mensajeError } from '../../../core/utils/errores';

type Campo = 'zona_id' | 'tipo_fuga_id' | 'titulo' | 'descripcion' | 'direccion' | 'latitud' | 'longitud';

const REQUERIDO: Record<Campo, string> = {
  zona_id: 'Selecciona la zona donde está la fuga',
  tipo_fuga_id: 'Selecciona el tipo de fuga',
  titulo: 'Escribe un título para el reporte',
  descripcion: 'Describe qué está pasando',
  direccion: 'Indica la dirección o un punto de referencia',
  latitud: '',
  longitud: '',
};

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-reporte-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reporte-form.html',
  styleUrl: './reporte-form.scss',
})
export class ReporteForm {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);
  private reportes = inject(ReportesService);
  private catalogos = inject(CatalogosService);
  private auth = inject(AuthService);

  readonly id = Number(this.ruta.snapshot.paramMap.get('id')) || null;
  readonly editando = this.id !== null;
  readonly gravedades = GRAVEDADES;
  readonly textoGravedad = textoGravedad;

  zonas = signal<Zona[]>([]);
  tipos = signal<TipoFuga[]>([]);
  archivos = signal<File[]>([]);
  cargando = signal(this.editando);
  enviando = signal(false);
  error = signal('');
  bloqueado = signal('');
  errorFotos = signal('');
  errorUbicacion = signal('');

  form = this.fb.group({
    zona_id: this.fb.control<number | null>(null, Validators.required),
    tipo_fuga_id: this.fb.control<number | null>(null, Validators.required),
    titulo: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]),
    descripcion: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10)]),
    direccion: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]),
    gravedad: this.fb.nonNullable.control('media'),
    latitud: this.fb.control<number | null>(null, [Validators.min(-90), Validators.max(90)]),
    longitud: this.fb.control<number | null>(null, [Validators.min(-180), Validators.max(180)]),
  });

  constructor() {
    this.catalogos.listar<Zona>('zonas', { limit: 50 }).subscribe({ next: (r) => this.zonas.set(r.data) });
    this.catalogos.listar<TipoFuga>('tipos-fuga', { limit: 50 }).subscribe({ next: (r) => this.tipos.set(r.data) });

    if (this.editando) {
      this.reportes.obtener(this.id!).subscribe({
        next: (r) => {
          if (!this.auth.esAdmin() && r.estado !== 'pendiente') {
            this.bloqueado.set('Solo se pueden editar los reportes que están pendientes.');
          } else {
            this.form.patchValue({
              titulo: r.titulo,
              descripcion: r.descripcion,
              direccion: r.direccion,
              gravedad: r.gravedad,
              zona_id: (r as any).zona_id ?? null,
              tipo_fuga_id: (r as any).tipo_fuga_id ?? null,
              latitud: r.latitud !== null ? Number(r.latitud) : null,
              longitud: r.longitud !== null ? Number(r.longitud) : null,
            });
          }
          this.cargando.set(false);
        },
        error: (e) => {
          this.bloqueado.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
    }
  }

  alElegirFotos(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const lista = Array.from(input.files ?? []);
    this.errorFotos.set('');
    this.archivos.set([]);

    if (lista.length > 3) {
      this.errorFotos.set('Puedes subir máximo 3 fotos');
    } else if (lista.some((f) => !TIPOS_FOTO.includes(f.type))) {
      this.errorFotos.set('Solo se permiten imágenes JPG, PNG o WEBP');
    } else if (lista.some((f) => f.size > 5 * 1024 * 1024)) {
      this.errorFotos.set('Cada foto debe pesar máximo 5 MB');
    } else {
      this.archivos.set(lista);
      return;
    }
    input.value = '';
  }

  usarUbicacion() {
    this.errorUbicacion.set('');
    if (!navigator.geolocation) {
      this.errorUbicacion.set('Tu navegador no permite obtener la ubicación');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        this.form.patchValue({
          latitud: Number(p.coords.latitude.toFixed(6)),
          longitud: Number(p.coords.longitude.toFixed(6)),
        }),
      () => this.errorUbicacion.set('No se pudo obtener tu ubicación. Escríbela a mano o déjala vacía.'),
    );
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.errorFotos()) return;

    this.enviando.set(true);
    this.error.set('');
    const v = this.form.getRawValue();

    if (this.editando) {
      const datos: Record<string, unknown> = {
        zona_id: v.zona_id,
        tipo_fuga_id: v.tipo_fuga_id,
        titulo: v.titulo,
        descripcion: v.descripcion,
        direccion: v.direccion,
        gravedad: v.gravedad,
      };
      if (v.latitud !== null) datos['latitud'] = v.latitud;
      if (v.longitud !== null) datos['longitud'] = v.longitud;

      this.reportes.actualizar(this.id!, datos).subscribe({
        next: () =>
          this.router.navigate(['/reportes', this.id], { state: { exito: 'Reporte actualizado correctamente' } }),
        error: (e) => this.fallar(e),
      });
    } else {
      const fd = new FormData();
      fd.append('zona_id', String(v.zona_id));
      fd.append('tipo_fuga_id', String(v.tipo_fuga_id));
      fd.append('titulo', v.titulo);
      fd.append('descripcion', v.descripcion);
      fd.append('direccion', v.direccion);
      fd.append('gravedad', v.gravedad);
      if (v.latitud !== null) fd.append('latitud', String(v.latitud));
      if (v.longitud !== null) fd.append('longitud', String(v.longitud));
      for (const f of this.archivos()) fd.append('fotos', f);

      this.reportes.crear(fd).subscribe({
        next: (r) => this.router.navigate(['/reportes', r.id], { state: { exito: 'Reporte creado correctamente' } }),
        error: (e) => this.fallar(e),
      });
    }
  }

  private fallar(e: unknown) {
    this.error.set(mensajeError(e));
    this.enviando.set(false);
  }

  mensaje(campo: Campo): string {
    const c = this.form.controls[campo];
    if (!(c.invalid && (c.touched || c.dirty))) return '';
    if (c.hasError('required')) return REQUERIDO[campo];
    if (c.hasError('minlength')) return `Escribe al menos ${c.getError('minlength').requiredLength} caracteres`;
    if (c.hasError('maxlength')) return `Máximo ${c.getError('maxlength').requiredLength} caracteres`;
    if (c.hasError('min') || c.hasError('max')) {
      return campo === 'latitud' ? 'La latitud debe estar entre -90 y 90' : 'La longitud debe estar entre -180 y 180';
    }
    return '';
  }
}