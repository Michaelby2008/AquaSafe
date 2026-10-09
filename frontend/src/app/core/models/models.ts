export type Rol = 'ciudadano' | 'administrador';
export type Gravedad = 'baja' | 'media' | 'alta' | 'critica';
export type Estado = 'pendiente' | 'en_revision' | 'asignado' | 'en_reparacion' | 'resuelto' | 'rechazado';

export interface UsuarioSesion { id: number; nombre: string; rol: Rol; }
export interface LoginResponse { token: string; usuario: UsuarioSesion; }
export interface Perfil { id: number; nombre: string; email: string; telefono: string | null; rol: Rol; }

export interface Paginado<T> { data: T[]; total: number; page: number; limit: number; }

export interface Zona { id: number; nombre: string; municipio: string; activa: boolean; }
export interface TipoFuga { id: number; nombre: string; descripcion: string | null; }
export interface Cuadrilla { id: number; nombre: string; telefono: string | null; zona_id: number | null; disponible: boolean; }

export interface ReporteResumen {
  id: number; titulo: string; direccion: string; gravedad: Gravedad;
  estado: Estado; creado_en: string; zona: string; tipo: string;
}
export interface ReporteDetalle extends ReporteResumen {
  descripcion: string; reportante: string; latitud: number | null; longitud: number | null;
  evidencias: { id: number; ruta_archivo: string }[];
  historial: { estado_anterior: string | null; estado_nuevo: string; comentario: string | null; fecha: string; usuario: string }[];
  asignaciones: { notas: string | null; fecha_asignacion: string; fecha_cierre: string | null; cuadrilla: string }[];
}

export interface UsuarioAdmin { id: number; nombre: string; email: string; telefono: string | null; activo: boolean; creado_en: string; rol: Rol; }

export interface DashboardData {
  resumen: { total: number; resueltos: number; pendientes: number; urgentes: number; horasPromedioResolucion: number | null };
  porEstado: { estado: Estado; total: number }[];
  porGravedad: { gravedad: Gravedad; total: number }[];
  porZona: { zona: string; total: number }[];
  ultimos: { id: number; titulo: string; gravedad: Gravedad; estado: Estado; creado_en: string }[];
  cuadrillasDisponibles: number | null;
}