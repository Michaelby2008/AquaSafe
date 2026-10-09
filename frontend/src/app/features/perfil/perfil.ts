import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Perfil as PerfilDatos } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/utils/errores';
import { mensajeControl } from '../../core/utils/formularios';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  readonly mensajeControl = mensajeControl;

  perfil = signal<PerfilDatos | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  errorCarga = signal('');
  error = signal('');
  exito = signal('');

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    telefono: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9+\-\s()]*$/)]],
  });

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.auth.obtenerPerfil().subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.form.reset({ nombre: p.nombre, telefono: p.telefono ?? '' });
        this.cargando.set(false);
      },
      error: (e) => {
        this.errorCarga.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, telefono } = this.form.getRawValue();
    this.guardando.set(true);
    this.error.set('');
    this.exito.set('');
    this.auth.actualizarPerfil({ nombre: nombre.trim(), telefono: telefono.trim() || undefined }).subscribe({
      next: () => {
        // El nombre de la barra superior sale de la sesión guardada: se actualiza también
        this.auth.actualizarNombreLocal(nombre.trim());
        this.perfil.update((p) => (p ? { ...p, nombre: nombre.trim(), telefono: telefono.trim() || null } : p));
        this.form.markAsPristine();
        this.guardando.set(false);
        this.exito.set('Tu perfil se actualizó correctamente');
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
