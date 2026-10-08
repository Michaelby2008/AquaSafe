import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/db';

async function login(email: string, password = 'Demo1234!') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token as string;
}

afterAll(async () => { await pool.end(); });

describe('API AquaSave', () => {
  it('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ok');
  });

  it('login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@aquasave.test', password: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  it('login correcto devuelve token y rol', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@aquasave.test', password: 'Demo1234!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.rol).toBe('administrador');
  });

  it('registro con correo inválido devuelve 400', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'Prueba', email: 'no-es-correo', password: '12345678' });
    expect(res.status).toBe(400);
  });

  it('rutas protegidas sin token devuelven 401', async () => {
    const res = await request(app).get('/api/reportes');
    expect(res.status).toBe(401);
  });

  it('un ciudadano no puede asignar cuadrillas (403)', async () => {
    const token = await login('ciudadano@aquasave.test');
    const res = await request(app).post('/api/reportes/1/asignar').set('Authorization', `Bearer ${token}`).send({ cuadrilla_id: 1 });
    expect(res.status).toBe(403);
  });

  it('un reporte inexistente devuelve 404', async () => {
    const token = await login('admin@aquasave.test');
    const res = await request(app).get('/api/reportes/999999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('el dashboard del admin trae el resumen', async () => {
    const token = await login('admin@aquasave.test');
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.resumen).toHaveProperty('total');
  });
});