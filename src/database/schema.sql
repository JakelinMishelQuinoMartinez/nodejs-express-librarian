CREATE DATABASE IF NOT EXISTS librarian CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE librarian;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identificacion VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30),
  direccion VARCHAR(200),
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS libros (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  titulo VARCHAR(160) NOT NULL,
  autor VARCHAR(120) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(80),
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prestamos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  fecha_prestamo DATE NOT NULL,
  fecha_devolucion_tentativa DATE NOT NULL,
  fecha_devolucion DATE,
  estado ENUM('activo', 'devuelto', 'vencido') NOT NULL DEFAULT 'activo',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_prestamos_usuario (usuario_id),
  INDEX idx_prestamos_estado (estado)
);

CREATE TABLE IF NOT EXISTS prestamo_libros (
  prestamo_id INT UNSIGNED NOT NULL,
  libro_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (prestamo_id, libro_id),
  FOREIGN KEY (prestamo_id) REFERENCES prestamos(id) ON DELETE CASCADE,
  FOREIGN KEY (libro_id) REFERENCES libros(id)
);

CREATE TABLE IF NOT EXISTS ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_ventas_usuario (usuario_id)
);

CREATE TABLE IF NOT EXISTS venta_libros (
  venta_id INT UNSIGNED NOT NULL,
  libro_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (venta_id, libro_id),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (libro_id) REFERENCES libros(id)
);