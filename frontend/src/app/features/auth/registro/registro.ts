import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeError } from '../../../core/utils/errores';

type Campo = 'nombre' | 'email' | 'telefono' | 'password' | 'confirmar';

const coinciden: ValidatorFn = (grupo) =>
  grupo.get('password')?.value === grupo.get('confirmar')?.value ? null : { noCoinciden: true };

const REQUERIDO: Record<string, string> = {
  nombre: 'Escribe tu nombre completo',
  email: 'Escribe tu correo electrónico',
  password: 'Crea una contraseña',
  confirmar: 'Repite tu contraseña',
};

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[0-9+\- ]{8,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: coinciden },
  );

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    const { nombre, email, telefono, password } = this.form.getRawValue();

    this.auth.registro({ nombre, email, telefono: telefono || undefined, password }).subscribe({
      next: () => {
        // Inicia sesión automáticamente con la cuenta recién creada
        this.auth.login(email, password).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => this.router.navigate(['/login']),
        });
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  mensaje(campo: Campo): string {
    const c = this.form.controls[campo];
    if (!(c.invalid && (c.touched || c.dirty))) return '';
    if (c.hasError('required')) return REQUERIDO[campo];
    if (c.hasError('minlength')) {
      return campo === 'nombre'
        ? 'El nombre debe tener al menos 3 caracteres'
        : 'La contraseña debe tener al menos 8 caracteres';
    }
    if (c.hasError('email')) return 'Escribe un correo válido, por ejemplo nombre@correo.com';
    if (c.hasError('pattern')) return 'Usa solo números, espacios, + o - (de 8 a 15 caracteres)';
    return '';
  }

  noCoinciden(): boolean {
    const c = this.form.controls.confirmar;
    return this.form.hasError('noCoinciden') && c.touched && !c.hasError('required');
  }
}