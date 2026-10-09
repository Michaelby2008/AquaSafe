import { AbstractControl, ValidationErrors } from '@angular/forms';

export function mensajeControl(c: AbstractControl | null): string | null {
  if (!c || !c.invalid || !(c.touched || c.dirty)) return null;
  const e = c.errors ?? {};
  if (e['required']) return 'Este campo es obligatorio';
  if (e['email']) return 'Escribe un correo válido, por ejemplo nombre@correo.com';
  if (e['minlength']) return `Escribe al menos ${e['minlength'].requiredLength} caracteres`;
  if (e['maxlength']) return `Escribe máximo ${e['maxlength'].requiredLength} caracteres`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}`;
  if (e['pattern']) return 'El formato no es válido';
  return 'El valor no es válido';
}

export function coincidenContrasenas(grupo: AbstractControl): ValidationErrors | null {
  const p = grupo.get('password')?.value;
  const c = grupo.get('confirmar')?.value;
  return p === c ? null : { noCoincide: true };
}