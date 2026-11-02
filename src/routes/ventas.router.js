import { Router } from 'express';
import pool from '../config/db.js';
import { autorizarUsuario } from '../util/autorizar-usuario.js';

const router = Router();

router.post('/', autorizarUsuario, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { libros, fecha } = req.body;
    if (!Array.isArray(libros) || !libros.length) {
      return res.status(400).json({ error: 'Debe incluir al menos un libro' });
    }
    await connection.beginTransaction();
    let total = 0;
    const productos = [];
    for (const libro of libros) {
      const [rows] = await connection.execute(
        'SELECT id, precio, stock FROM libros WHERE id = ? AND activo = TRUE',
        [libro.id]
      );
      if (!rows.length || rows[0].stock < (libro.cantidad || 1)) {
        throw Object.assign(new Error('Libro no disponible o stock insuficiente'), { statusCode: 409 });
      }
      const cantidad = libro.cantidad || 1;
      productos.push({ id: rows[0].id, cantidad, precio: Number(rows[0].precio) });
      total += Number(rows[0].precio) * cantidad;
    }
    const [venta] = await connection.execute(
      'INSERT INTO ventas (usuario_id, fecha, total) VALUES (?, ?, ?)',
      [req.usuario.id, fecha || new Date().toISOString().slice(0, 10), total]
    );
    for (const producto of productos) {
      await connection.execute(
        `INSERT INTO venta_libros (venta_id, libro_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)`,
        [venta.insertId, producto.id, producto.cantidad, producto.precio]
      );
      await connection.execute(
        'UPDATE libros SET stock = stock - ? WHERE id = ?',
        [producto.cantidad, producto.id]
      );
    }
    await connection.commit();
    res.status(201).json({ id: venta.insertId, total, mensaje: 'Venta registrada con éxito' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/', autorizarUsuario, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT v.*, u.nombre AS cliente FROM ventas v
       JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.usuario_id = ? OR ? = 'admin'
       ORDER BY v.fecha DESC`,
      [req.usuario.id, req.usuario.rol]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
