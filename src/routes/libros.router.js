import { Router } from 'express';
import pool from '../config/db.js';
import { autorizarUsuario, autorizarAdmin } from '../util/autorizar-usuario.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const busqueda = req.query.buscar?.trim();
    let sql = 'SELECT * FROM libros WHERE activo = TRUE';
    const params = [];
    if (busqueda) {
      sql += ' AND (titulo LIKE ? OR autor LIKE ? OR codigo LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }
    sql += ' ORDER BY titulo';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM libros WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', autorizarUsuario, autorizarAdmin, async (req, res, next) => {
  try {
    const { codigo, titulo, autor, descripcion = null, categoria = null, precio = 0, stock = 0 } = req.body;
    if (!codigo || !titulo || !autor) return res.status(400).json({ error: 'Código, título y autor son obligatorios' });
    const [result] = await pool.execute(
      `INSERT INTO libros (codigo, titulo, autor, descripcion, categoria, precio, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigo, titulo, autor, descripcion, categoria, precio, stock]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Libro registrado con éxito' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') error.statusCode = 409;
    next(error);
  }
});

router.put('/:id', autorizarUsuario, autorizarAdmin, async (req, res, next) => {
  try {
    const campos = ['codigo', 'titulo', 'autor', 'descripcion', 'categoria', 'precio', 'stock', 'activo'];
    const existentes = campos.filter(campo => req.body[campo] !== undefined);
    if (!existentes.length) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const sql = `UPDATE libros SET ${existentes.map(campo => `${campo} = ?`).join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(sql, [...existentes.map(campo => req.body[campo]), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json({ mensaje: 'Libro actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', autorizarUsuario, autorizarAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.execute('UPDATE libros SET activo = FALSE WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json({ mensaje: 'Libro eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
