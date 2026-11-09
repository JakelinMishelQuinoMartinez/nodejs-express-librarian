import express from 'express';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import librosRouter from './src/routes/libros.router.js';
import usuariosRouter from './src/routes/usuarios.router.js';
import prestamosRouter from './src/routes/prestamos.router.js';
import ventasRouter from './src/routes/ventas.router.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'librarian-cookie-secret'));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin === FRONTEND_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(origin === FRONTEND_ORIGIN ? 204 : 403);
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    nombre: 'Librarian API',
    endpoints: ['/libros', '/usuarios', '/prestamos', '/ventas']
  });
});

app.use('/libros', librosRouter);
app.use('/usuarios', usuariosRouter);
app.use('/prestamos', prestamosRouter);
app.use('/ventas', ventasRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    mensaje: err.message || 'Error interno del servidor',
    errores: err.details || null
  });
});

app.listen(PORT, () => {
  console.log(`Librarian API ejecutándose en http://localhost:${PORT}`);
});