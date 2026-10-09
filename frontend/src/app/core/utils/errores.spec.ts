import { HttpErrorResponse } from '@angular/common/http';
import { mensajeError } from './errores';

describe('mensajeError', () => {
  it('avisa cuando no hay conexión', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
  });

  it('usa el mensaje que envía el backend', () => {
    const err = new HttpErrorResponse({ status: 409, error: { mensaje: 'La cuadrilla no está disponible' } });
    expect(mensajeError(err)).toBe('La cuadrilla no está disponible');
  });

  it('une los errores de validación', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { mensaje: 'Datos inválidos', errores: [{ campo: 'a', mensaje: 'Uno' }, { campo: 'b', mensaje: 'Dos' }] },
    });
    expect(mensajeError(err)).toBe('Uno. Dos');
  });

  it('usa un mensaje genérico con errores desconocidos', () => {
    expect(mensajeError(new Error('x'))).toContain('Ocurrió un error inesperado');
  });
});
