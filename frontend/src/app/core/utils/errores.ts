import { HttpErrorResponse } from '@angular/common/http';

export function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    const cuerpo = err.error;
    if (cuerpo?.errores?.length) {
      return cuerpo.errores.map((e: { campo: string; mensaje: string }) => e.mensaje).join('. ');
    }
    if (cuerpo?.mensaje) return cuerpo.mensaje;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}