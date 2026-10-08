import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { auth, permitir, Payload } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import { AppError } from '../../utils/AppError';
import { conTransaccion } from '../../utils/tx';
import { ESTADOS, cambiarEstado, asignarCuadrilla } from './reportes.service';

const r = Router();
r.use(auth);

const reporteSchema = z.object({
  zona_id: z.coerce.number().int().positive('Selecciona una zona'),
  tipo_fuga_id: z.coerce.number().int().positive('Selecciona un tipo de fuga'),
  titulo: z.string().min(5, 'Mínimo 5 caracteres').max(150),
  descripcion: z.string().min(10, 'Describe el problema (mínimo 10 caracteres)'),
  direccion: z.string().min(5, 'Indica la dirección').max(255),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
  gravedad: z.enum(['baja', 'media', 'alta', 'critica']),
});

const getUser = (req: any): Payload => req.user;

// Un ciudadano solo ve sus reportes; el admin ve todos
async function obtenerReporte(id: number, user: Payload) {
  const [rows]: any = await pool.query(
    `SELECT r.*, z.nombre AS zona, t.nombre AS tipo, u.nombre AS reportante
     FROM reportes r JOIN zonas z ON z.id = r.zona_id JOIN tipos_fuga t ON t.id = r.tipo_fuga_id
     JOIN usuarios u ON u.id = r.usuario_id WHERE r.id = ?`, [id]);
  const rep = rows[0];
  if (!rep || (user.rol !== 'administrador' && rep.usuario_id !== user.id))
    throw new AppError(404, 'Reporte no encontrado');
  return rep;
}

// LISTAR
r.get('/', async (req, res) => {
  const user = getUser(req);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const where: string[] = [];
  const params: any[] = [];

  if (user.rol !== 'administrador') { where.push('r.usuario_id = ?'); params.push(user.id); }
  for (const f of ['estado', 'gravedad', 'zona_id'] as const) {
    if (req.query[f]) { where.push(`r.${f} = ?`); params.push(String(req.query[f])); }
  }
  if (req.query.q) {
    where.push('(r.titulo LIKE ? OR r.direccion LIKE ?)');
    params.push(`%${String(req.query.q)}%`, `%${String(req.query.q)}%`);
  }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const orden = req.query.orden === 'antiguos' ? 'ASC' : 'DESC';

  const [rows] = await pool.query(
    `SELECT r.id, r.titulo, r.direccion, r.gravedad, r.estado, r.creado_en, z.nombre AS zona, t.nombre AS tipo
     FROM reportes r JOIN zonas z ON z.id = r.zona_id JOIN tipos_fuga t ON t.id = r.tipo_fuga_id
     ${w} ORDER BY r.creado_en ${orden} LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) total FROM reportes r ${w}`, params);
  res.json({ data: rows, total, page, limit });
});

// DETALLE
r.get('/:id', async (req, res) => {
  const rep = await obtenerReporte(Number(req.params.id), getUser(req));
  const [evidencias] = await pool.query('SELECT id, ruta_archivo FROM evidencias WHERE reporte_id = ?', [rep.id]);
  const [historial] = await pool.query(
    `SELECT h.estado_anterior, h.estado_nuevo, h.comentario, h.fecha, u.nombre AS usuario
     FROM historial_estados h JOIN usuarios u ON u.id = h.usuario_id WHERE h.reporte_id = ? ORDER BY h.fecha`, [rep.id]);
  const [asignaciones] = await pool.query(
    `SELECT a.notas, a.fecha_asignacion, a.fecha_cierre, c.nombre AS cuadrilla
     FROM asignaciones a JOIN cuadrillas c ON c.id = a.cuadrilla_id WHERE a.reporte_id = ?`, [rep.id]);
  res.json({ ...rep, evidencias, historial, asignaciones });
});

// CREAR
r.post('/', upload.array('fotos', 3), async (req, res) => {
  const user = getUser(req);
  const d = reporteSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[]) ?? [];
  const id = await conTransaccion(async (conn) => {
    const [ins]: any = await conn.query('INSERT INTO reportes SET ?', [{ ...d, usuario_id: user.id }]);
    for (const f of files)
      await conn.query('INSERT INTO evidencias (reporte_id, ruta_archivo) VALUES (?,?)', [ins.insertId, f.filename]);
    await conn.query(
      'INSERT INTO historial_estados (reporte_id, usuario_id, estado_nuevo, comentario) VALUES (?,?,?,?)',
      [ins.insertId, user.id, 'pendiente', 'Reporte creado']);
    return ins.insertId as number;
  });
  res.status(201).json({ id, mensaje: 'Reporte creado correctamente' });
});

// ACTUALIZAR
r.put('/:id', async (req, res) => {
  const user = getUser(req);
  const rep = await obtenerReporte(Number(req.params.id), user);
  if (user.rol !== 'administrador' && rep.estado !== 'pendiente')
    throw new AppError(409, 'Solo puedes editar reportes pendientes');
  const d = reporteSchema.parse(req.body);
  await pool.query('UPDATE reportes SET ? WHERE id = ?', [d, rep.id]);
  res.json({ mensaje: 'Reporte actualizado' });
});

// ELIMINAR
r.delete('/:id', async (req, res) => {
  const user = getUser(req);
  const rep = await obtenerReporte(Number(req.params.id), user);
  if (user.rol !== 'administrador' && rep.estado !== 'pendiente')
    throw new AppError(409, 'Solo puedes eliminar reportes pendientes');
  await pool.query('DELETE FROM reportes WHERE id = ?', [rep.id]);
  res.json({ mensaje: 'Reporte eliminado' });
});

// ===== PROCESO PRINCIPAL (solo administrador) =====
r.patch('/:id/estado', permitir('administrador'), async (req, res) => {
  const d = z.object({
    estado: z.enum(ESTADOS, { message: 'Estado no válido' }),
    comentario: z.string().max(255).optional(),
  }).parse(req.body);
  await cambiarEstado(Number(req.params.id), d.estado, getUser(req).id, d.comentario);
  res.json({ mensaje: 'Estado actualizado' });
});

r.post('/:id/asignar', permitir('administrador'), async (req, res) => {
  const d = z.object({
    cuadrilla_id: z.number().int().positive('Selecciona una cuadrilla'),
    notas: z.string().max(255).optional(),
  }).parse(req.body);
  await asignarCuadrilla(Number(req.params.id), d.cuadrilla_id, getUser(req).id, d.notas);
  res.json({ mensaje: 'Cuadrilla asignada correctamente' });
});

export default r;