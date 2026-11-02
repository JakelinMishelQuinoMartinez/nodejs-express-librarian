import { validationResult } from 'express-validator';

export default function manejarErroresValidacion(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const error = new Error('Errores de validación');
    error.statusCode = 400;
    error.details = errores.array();
    return next(error);
  }
  next();
}
