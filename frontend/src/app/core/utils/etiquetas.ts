import { Estado, Gravedad } from '../models/models';

export interface InfoEtiqueta { texto: string; clase: string; }

export const ESTADOS: Estado[] = ['pendiente', 'en_revision', 'asignado', 'en_reparacion', 'resuelto', 'rechazado'];
export const GRAVEDADES: Gravedad[] = ['baja', 'media', 'alta', 'critica'];

export const ETIQUETA_ESTADO: Record<string, InfoEtiqueta> = {
  pendiente: { texto: 'Pendiente', clase: 'badge-warn' },
  en_revision: { texto: 'En revisión', clase: 'badge-info' },
  asignado: { texto: 'Asignado', clase: 'badge-teal' },
  en_reparacion: { texto: 'En reparación', clase: 'badge-info' },
  resuelto: { texto: 'Resuelto', clase: 'badge-ok' },
  rechazado: { texto: 'Rechazado', clase: 'badge-error' },
};

export const ETIQUETA_GRAVEDAD: Record<string, InfoEtiqueta> = {
  baja: { texto: 'Baja', clase: 'badge-neutral' },
  media: { texto: 'Media', clase: 'badge-info' },
  alta: { texto: 'Alta', clase: 'badge-warn' },
  critica: { texto: 'Crítica', clase: 'badge-error' },
};

export const textoEstado = (e: string) => ETIQUETA_ESTADO[e]?.texto ?? e;
export const textoGravedad = (g: string) => ETIQUETA_GRAVEDAD[g]?.texto ?? g;

// Cambios de estado permitidos desde el panel (espejo de TRANSICIONES en backend/reportes.service.ts).
// Para pasar a "asignado" no se usa el cambio de estado: se asigna una cuadrilla.
export const TRANSICIONES: Record<Estado, Estado[]> = {
  pendiente: ['en_revision', 'rechazado'],
  en_revision: ['rechazado'],
  asignado: ['en_reparacion'],
  en_reparacion: ['resuelto'],
  resuelto: [],
  rechazado: [],
};

// Estados desde los que se puede asignar una cuadrilla
export const ESTADOS_ASIGNABLES: Estado[] = ['pendiente', 'en_revision'];
