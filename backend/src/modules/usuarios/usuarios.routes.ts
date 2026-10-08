import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { auth, permitir, Payload } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';

const r = Router();
r.use(auth, permitir('administrador'));

r.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const q = `%${String(req.query.q ?? '')}%`;
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.telefono, u.activo, u.creado_en, r.nombre AS rol
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.nombre LIKE ? OR u.email LIKE ? ORDER BY u.id DESC LIMIT ? OFFSET ?`, [q, q, limit, (page - 1) * limit]);
  const [[{ total }]]: any = await pool.query(
    'SELECT COUNT(*) total FROM usuarios WHERE nombre LIKE ? OR email LIKE ?', [q, q]);
  res.json({ data: rows, total, page, limit });
});

r.patch('/:id', async (req, res) => {
  const yo = (req as any).user as Payload;
  const id = Number(req.params.id);
  if (id === yo.id) throw new AppError(409, 'No puedes modificar tu propio usuario');

  const d = z.object({
    rol: z.enum(['ciudadano', 'administrador']).optional(),
    activo: z.boolean().optional(),
  }).refine(v => v.rol !== undefined || v.activo !== undefined, 'Indica el rol o el estado').parse(req.body);

  const sets: string[] = [];
  const params: any[] = [];
  if (d.rol) { sets.push('rol_id = (SELECT id FROM roles WHERE nombre = ?)'); params.push(d.rol); }
  if (d.activo !== undefined) { sets.push('activo = ?'); params.push(d.activo); }

  const [upd]: any = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  if (!upd.affectedRows) throw new AppError(404, 'Usuario no encontrado');
  res.json({ mensaje: 'Usuario actualizado' });
});

export default r;