import pool from '../config/db.js';

export async function autorizarUsuario(req, res, next) {
  try {
    const identificacion = req.signedCookies.auth;
    if (!identificacion) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    const [rows] = await pool.execute(
      'SELECT id, identificacion, nombre, email, rol, activo FROM usuarios WHERE identificacion = ?',
      [identificacion]
    );
    if (!rows.length || !rows[0].activo) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    req.usuario = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function autorizarAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }
  next();
}
