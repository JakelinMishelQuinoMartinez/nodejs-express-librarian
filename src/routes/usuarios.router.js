import { Router } from 'express';
import { hashSync, compareSync } from 'bcrypt';
import pool from '../config/db.js';
import { UsuarioCrearDTO, UsuarioObtenerDTO } from '../dto/usuario.dto.js';
import { usuarioCrearValidaciones } from '../validations/usuario.validations.js';
import manejarErroresValidacion from '../middleware/validation.middleware.js';
import { autorizarUsuario } from '../util/autorizar-usuario.js';

const router = Router();

router.post('/', usuarioCrearValidaciones, manejarErroresValidacion, async (req, res, next) => {
  try {
    const usuario = new UsuarioCrearDTO({
      ...req.body,
      password: hashSync(req.body.password, 10),
      rol: undefined
    });
    const [result] = await pool.execute(
      `INSERT INTO usuarios (identificacion, nombre, telefono, direccion, email, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario.identificacion, usuario.nombre, usuario.telefono, usuario.direccion, usuario.email, usuario.password]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') error.statusCode = 409;
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [req.body.email]
    );
    if (!rows.length || !compareSync(req.body.password || '', rows[0].password)) {
      return res.status(401).json({ error: 'Usuario o contraseña inválida' });
    }
    res.cookie('auth', rows[0].identificacion, {
      signed: true,
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000
    });
    res.json(new UsuarioObtenerDTO(rows[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth');
  res.json({ mensaje: 'Sesión cerrada' });
});

router.get('/perfil', autorizarUsuario, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
  res.json(new UsuarioObtenerDTO(rows[0]));
});

router.get('/:id', autorizarUsuario, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(new UsuarioObtenerDTO(rows[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/perfil', autorizarUsuario, async (req, res, next) => {
  try {
    const permitidos = ['nombre', 'telefono', 'direccion', 'email'];
    const valores = permitidos.map(campo => req.body[campo] ?? null);
    await pool.execute(
      `UPDATE usuarios SET
       nombre = COALESCE(?, nombre), telefono = COALESCE(?, telefono),
       direccion = COALESCE(?, direccion), email = COALESCE(?, email)
       WHERE id = ?`,
      [...valores, req.usuario.id]
    );
    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/historial', autorizarUsuario, async (req, res, next) => {
  try {
    const [prestamos] = await pool.execute(
      `SELECT p.* FROM prestamos p WHERE p.usuario_id = ? ORDER BY p.fecha_prestamo DESC`,
      [req.params.id]
    );
    const [ventas] = await pool.execute(
      `SELECT v.* FROM ventas v WHERE v.usuario_id = ? ORDER BY v.fecha DESC`,
      [req.params.id]
    );
    res.json({ prestamos, compras: ventas });
  } catch (error) {
    next(error);
  }
});

export default router;
