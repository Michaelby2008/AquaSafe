CREATE DATABASE IF NOT EXISTS aquasave_in5bv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aquasave_in5bv;

CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rol_id TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE zonas (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  municipio VARCHAR(100) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipos_fuga (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL
);

CREATE TABLE cuadrillas (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20) NULL,
  zona_id INT UNSIGNED NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL
);

CREATE TABLE reportes (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  zona_id INT UNSIGNED NOT NULL,
  tipo_fuga_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  latitud DECIMAL(9,6) NULL,
  longitud DECIMAL(9,6) NULL,
  gravedad ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
  estado ENUM('pendiente','en_revision','asignado','en_reparacion','resuelto','rechazado') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (zona_id) REFERENCES zonas(id),
  FOREIGN KEY (tipo_fuga_id) REFERENCES tipos_fuga(id),
  INDEX idx_estado (estado),
  INDEX idx_gravedad (gravedad),
  INDEX idx_zona (zona_id),
  INDEX idx_creado (creado_en)
);

CREATE TABLE evidencias (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reporte_id INT UNSIGNED NOT NULL,
  ruta_archivo VARCHAR(255) NOT NULL,
  subido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE
);

CREATE TABLE asignaciones (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reporte_id INT UNSIGNED NOT NULL,
  cuadrilla_id INT UNSIGNED NOT NULL,
  asignado_por INT UNSIGNED NOT NULL,
  notas VARCHAR(255) NULL,
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP NULL,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id),
  FOREIGN KEY (cuadrilla_id) REFERENCES cuadrillas(id),
  FOREIGN KEY (asignado_por) REFERENCES usuarios(id)
);

CREATE TABLE historial_estados (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reporte_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  estado_anterior VARCHAR(20) NULL,
  estado_nuevo VARCHAR(20) NOT NULL,
  comentario VARCHAR(255) NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

INSERT IGNORE INTO roles (nombre) VALUES ('ciudadano'), ('administrador');