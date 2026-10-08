import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { auth } from '../../middlewares/auth';

const r = Router();

const registroSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

r.post('/registro', async (req, res) => {
  const d = registroSchema.parse(req.body);
  const [ex]: any = await pool.query('SELECT id FROM usuarios WHERE email = ?', [d.email]);
  if (ex.length) throw new AppError(409, 'El correo ya está registrado');
  const hash = await bcrypt.hash(d.password, 10);
  await pool.query(
    "INSERT INTO usuarios (rol_id, nombre, email, telefono, password_hash) VALUES ((SELECT id FROM roles WHERE nombre='ciudadano'), ?, ?, ?, ?)",
    [d.nombre, d.email, d.telefono ?? null, hash]);
  res.status(201).json({ mensaje: 'Usuario registrado' });
});

r.post('/login', async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const [rows]: any = await pool.query(
    'SELECT u.id, u.nombre, u.password_hash, u.activo, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.email = ?', [email]);
  const u = rows[0];
  if (!u || !u.activo || !(await bcrypt.compare(password, u.password_hash)))
    throw new AppError(401, 'Credenciales incorrectas');
  const token = jwt.sign({ id: u.id, rol: u.rol }, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN ?? '2h') as any });
  res.json({ token, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
});

r.get('/perfil', auth, async (req, res) => {
  const [rows]: any = await pool.query(
    'SELECT u.id, u.nombre, u.email, u.telefono, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id = ?', [(req as any).user.id]);
  res.json(rows[0]);
});

r.put('/perfil', auth, async (req, res) => {
  const d = z.object({ nombre: z.string().min(3), telefono: z.string().optional() }).parse(req.body);
  await pool.query('UPDATE usuarios SET nombre=?, telefono=? WHERE id=?', [d.nombre, d.telefono ?? null, (req as any).user.id]);
  res.json({ mensaje: 'Perfil actualizado' });
});

export default r;