// Utilidades compartidas por las pruebas (no se incluyen en la aplicación).
import { Cuadrilla, ReporteDetalle } from '../core/models/models';

// jsdom no implementa showModal/close de <dialog>: se simulan con el atributo "open"
export function simularDialog() {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  proto['showModal'] = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto['close'] = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

export function reporteDe(cambios: Partial<ReporteDetalle> = {}): ReporteDetalle {
  return {
    id: 5,
    titulo: 'Fuga en la calle principal',
    direccion: '3a avenida 4-21, zona 1',
    gravedad: 'alta',
    estado: 'pendiente',
    creado_en: '2026-10-01T10:00:00.000Z',
    zona: 'Zona 1',
    tipo: 'Rotura de tubería',
    zona_id: 1,
    tipo_fuga_id: 1,
    descripcion: 'Sale agua desde hace dos días',
    reportante: 'María López',
    latitud: null,
    longitud: null,
    evidencias: [],
    historial: [],
    asignaciones: [],
    ...cambios,
  };
}

export const CUADRILLAS: Cuadrilla[] = [
  { id: 1, nombre: 'Beta', telefono: null, zona_id: 2, disponible: true },
  { id: 2, nombre: 'Alfa', telefono: null, zona_id: 1, disponible: true },
  { id: 3, nombre: 'Ocupada', telefono: null, zona_id: 1, disponible: false },
];
