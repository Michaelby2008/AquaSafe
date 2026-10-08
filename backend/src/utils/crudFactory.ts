import { Router } from 'express';
import { ZodObject } from 'zod';
import { pool } from '../config/db';
import { AppError } from './AppError';
import { auth, permitir } from '../middlewares/auth';

export function crearCrud(tabla: string, schema: ZodObject<any>, campoBusqueda: string) {
  const r = Router();
  r.use(auth);

  r.get('/', async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const q = `%${String(req.query.q ?? '')}%`;
    const [rows] = await pool.query(
      `SELECT * FROM ${tabla} WHERE ${campoBusqueda} LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [q, limit, (page - 1) * limit]);
    const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) total FROM ${tabla} WHERE ${campoBusqueda} LIKE ?`, [q]);
    res.json({ data: rows, total, page, limit });
  });

  r.get('/:id', async (req, res) => {
    const [rows]: any = await pool.query(`SELECT * FROM ${tabla} WHERE id = ?`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Registro no encontrado');
    res.json(rows[0]);
  });

  r.post('/', permitir('administrador'), async (req, res) => {
    const d = schema.parse(req.body);
    const [ins]: any = await pool.query(`INSERT INTO ${tabla} SET ?`, [d]);
    res.status(201).json({ id: ins.insertId, mensaje: 'Creado correctamente' });
  });

  r.put('/:id', permitir('administrador'), async (req, res) => {
    const d = schema.parse(req.body);
    const [upd]: any = await pool.query(`UPDATE ${tabla} SET ? WHERE id = ?`, [d, req.params.id]);
    if (!upd.affectedRows) throw new AppError(404, 'Registro no encontrado');
    res.json({ mensaje: 'Actualizado correctamente' });
  });

  r.delete('/:id', permitir('administrador'), async (req, res) => {
    const [del]: any = await pool.query(`DELETE FROM ${tabla} WHERE id = ?`, [req.params.id]);
    if (!del.affectedRows) throw new AppError(404, 'Registro no encontrado');
    res.json({ mensaje: 'Eliminado correctamente' });
  });

  return r;
}