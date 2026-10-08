import { conTransaccion } from '../../utils/tx';
import { AppError } from '../../utils/AppError';

export const ESTADOS = ['pendiente', 'en_revision', 'asignado', 'en_reparacion', 'resuelto', 'rechazado'] as const;

// Qué cambios de estado están permitidos
const TRANSICIONES: Record<string, string[]> = {
  pendiente: ['en_revision', 'rechazado'],
  en_revision: ['rechazado'],          // para asignar se usa /asignar
  asignado: ['en_reparacion'],
  en_reparacion: ['resuelto'],
  resuelto: [],
  rechazado: [],
};

export async function cambiarEstado(reporteId: number, nuevo: string, adminId: number, comentario?: string) {
  await conTransaccion(async (conn) => {
    const [rows]: any = await conn.query('SELECT estado FROM reportes WHERE id = ? FOR UPDATE', [reporteId]);
    if (!rows[0]) throw new AppError(404, 'Reporte no encontrado');
    const actual: string = rows[0].estado;
    if (!TRANSICIONES[actual].includes(nuevo))
      throw new AppError(409, `No se puede pasar de "${actual}" a "${nuevo}"`);

    await conn.query('UPDATE reportes SET estado = ? WHERE id = ?', [nuevo, reporteId]);

    if (nuevo === 'resuelto') {
      // Libera la cuadrilla y cierra la asignación
      await conn.query(
        `UPDATE cuadrillas c JOIN asignaciones a ON a.cuadrilla_id = c.id
         SET c.disponible = TRUE, a.fecha_cierre = NOW()
         WHERE a.reporte_id = ? AND a.fecha_cierre IS NULL`, [reporteId]);
    }
    await conn.query(
      'INSERT INTO historial_estados (reporte_id, usuario_id, estado_anterior, estado_nuevo, comentario) VALUES (?,?,?,?,?)',
      [reporteId, adminId, actual, nuevo, comentario ?? null]);
  });
}

export async function asignarCuadrilla(reporteId: number, cuadrillaId: number, adminId: number, notas?: string) {
  await conTransaccion(async (conn) => {
    const [rep]: any = await conn.query('SELECT estado FROM reportes WHERE id = ? FOR UPDATE', [reporteId]);
    if (!rep[0]) throw new AppError(404, 'Reporte no encontrado');
    const actual: string = rep[0].estado;
    if (!['pendiente', 'en_revision'].includes(actual))
      throw new AppError(409, 'Solo se puede asignar un reporte pendiente o en revisión');

    const [cua]: any = await conn.query('SELECT disponible FROM cuadrillas WHERE id = ? FOR UPDATE', [cuadrillaId]);
    if (!cua[0]) throw new AppError(404, 'Cuadrilla no encontrada');
    if (!cua[0].disponible) throw new AppError(409, 'La cuadrilla no está disponible');

    await conn.query('INSERT INTO asignaciones (reporte_id, cuadrilla_id, asignado_por, notas) VALUES (?,?,?,?)',
      [reporteId, cuadrillaId, adminId, notas ?? null]);
    await conn.query('UPDATE cuadrillas SET disponible = FALSE WHERE id = ?', [cuadrillaId]);
    await conn.query("UPDATE reportes SET estado = 'asignado' WHERE id = ?", [reporteId]);
    await conn.query(
      'INSERT INTO historial_estados (reporte_id, usuario_id, estado_anterior, estado_nuevo, comentario) VALUES (?,?,?,?,?)',
      [reporteId, adminId, actual, 'asignado', notas ?? 'Cuadrilla asignada']);
  });
}