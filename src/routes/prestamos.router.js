import { Router } from 'express';
import pool from '../config/db.js';
import { autorizarUsuario, autorizarAdmin } from '../util/autorizar-usuario.js';

const router = Router();

router.get('/', autorizarUsuario, autorizarAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.nombre AS usuario, u.identificacion
       FROM prestamos p JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY p.fecha_prestamo DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', autorizarUsuario, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { libros, fechaPrestamo, fechaDevolucionTentativa } = req.body;
    if (!Array.isArray(libros) || !libros.length || !fechaPrestamo || !fechaDevolucionTentativa) {
      return res.status(400).json({ error: 'Debe incluir libros y ambas fechas' });
    }
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO prestamos (usuario_id, fecha_prestamo, fecha_devolucion_tentativa)
       VALUES (?, ?, ?)`,
      [req.usuario.id, fechaPrestamo, fechaDevolucionTentativa]
    );
    for (const libro of libros) {
      await connection.execute(
        `INSERT INTO prestamo_libros (prestamo_id, libro_id, cantidad) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
        [result.insertId, libro.id, libro.cantidad || 1]
      );
      const [stock] = await connection.execute(
        'UPDATE libros SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [libro.cantidad || 1, libro.id, libro.cantidad || 1]
      );
      if (!stock.affectedRows) throw Object.assign(new Error('Stock insuficiente para el préstamo'), { statusCode: 409 });
    }
    await connection.commit();
    res.status(201).json({ id: result.insertId, mensaje: 'Préstamo registrado con éxito' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch('/:id/devolver', autorizarUsuario, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT * FROM prestamos WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    if (rows[0].estado === 'devuelto') {
      await connection.rollback();
      return res.status(409).json({ error: 'El préstamo ya fue devuelto' });
    }
    await connection.execute(
      `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion = ?
       WHERE id = ?`,
      [req.body.fechaDevolucion || new Date().toISOString().slice(0, 10), req.params.id]
    );
    const [libros] = await connection.execute(
      'SELECT libro_id, cantidad FROM prestamo_libros WHERE prestamo_id = ?', [req.params.id]
    );
    for (const libro of libros) {
      await connection.execute('UPDATE libros SET stock = stock + ? WHERE id = ?', [libro.cantidad, libro.libro_id]);
    }
    await connection.commit();
    res.json({ mensaje: 'Préstamo devuelto correctamente' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

export default router;
