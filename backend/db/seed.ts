import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db';

(async () => {
  const hash = await bcrypt.hash('Demo1234!', 10);
  await pool.query("INSERT IGNORE INTO usuarios (rol_id,nombre,email,password_hash) VALUES (2,'Admin Demo','admin@aquasave.test',?),(1,'Ciudadano Demo','ciudadano@aquasave.test',?)", [hash, hash]);
  await pool.query("INSERT IGNORE INTO zonas (nombre,municipio) VALUES ('Zona 1','Guatemala'),('Zona 7','Guatemala'),('Zona 18','Guatemala')");
  await pool.query("INSERT IGNORE INTO tipos_fuga (nombre) VALUES ('Tubería rota'),('Fuga en medidor'),('Hidrante dañado'),('Rebalse de tanque')");
  await pool.query("INSERT IGNORE INTO cuadrillas (nombre,zona_id) VALUES ('Cuadrilla Norte',1),('Cuadrilla Sur',2)");
  console.log('Seed listo'); process.exit(0);
})();