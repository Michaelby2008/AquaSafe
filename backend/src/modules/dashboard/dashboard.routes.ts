import { Router } from 'express';
import { pool } from '../../config/db';
import { auth, Payload } from '../../middlewares/auth';

const r = Router();
r.use(auth);

r.get('/', async (req, res) => {
  const user = (req as any).user as Payload;
  const esAdmin = user.rol === 'administrador';
  const cond = esAdmin ? '' : 'WHERE r.usuario_id = ?';
  const condAnd = esAdmin ? '' : 'AND r.usuario_id = ?';
  const p = esAdmin ? [] : [user.id];

  const [resumenQ, porEstado, porGravedad, porZona, promedioQ, ultimos, cuadQ]: any[] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(r.estado = 'resuelto'), 0) AS resueltos,
              COALESCE(SUM(r.estado IN ('pendiente','en_revision')), 0) AS pendientes,
              COALESCE(SUM(r.gravedad IN ('alta','critica') AND r.estado NOT IN ('resuelto','rechazado')), 0) AS urgentes
       FROM reportes r ${cond}`, p),
    pool.query(`SELECT r.estado, COUNT(*) AS total FROM reportes r ${cond} GROUP BY r.estado`, p),
    pool.query(`SELECT r.gravedad, COUNT(*) AS total FROM reportes r ${cond} GROUP BY r.gravedad`, p),
    pool.query(
      `SELECT z.nombre AS zona, COUNT(*) AS total FROM reportes r JOIN zonas z ON z.id = r.zona_id
       ${cond} GROUP BY z.id, z.nombre ORDER BY total DESC LIMIT 5`, p),
    pool.query(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, r.creado_en, h.fecha)) AS horas
       FROM reportes r JOIN historial_estados h ON h.reporte_id = r.id AND h.estado_nuevo = 'resuelto'
       WHERE r.estado = 'resuelto' ${condAnd}`, p),
    pool.query(
      `SELECT r.id, r.titulo, r.gravedad, r.estado, r.creado_en FROM reportes r ${cond}
       ORDER BY r.creado_en DESC LIMIT 5`, p),
    esAdmin ? pool.query('SELECT COUNT(*) AS total FROM cuadrillas WHERE disponible = TRUE') : Promise.resolve([[{ total: null }]]),
  ]);

  const resumen = resumenQ[0][0];
  const horas = promedioQ[0][0].horas;
  res.json({
    resumen: {
      total: Number(resumen.total),
      resueltos: Number(resumen.resueltos),
      pendientes: Number(resumen.pendientes),
      urgentes: Number(resumen.urgentes),
      horasPromedioResolucion: horas === null ? null : Math.round(Number(horas) * 10) / 10,
    },
    porEstado: porEstado[0],
    porGravedad: porGravedad[0],
    porZona: porZona[0],
    ultimos: ultimos[0],
    cuadrillasDisponibles: cuadQ[0][0].total,
  });
});

export default r;