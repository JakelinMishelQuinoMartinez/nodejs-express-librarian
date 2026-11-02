import { body } from 'express-validator';

export const usuarioCrearValidaciones = [
  body('identificacion').trim().notEmpty().withMessage('La identificación es obligatoria'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('telefono').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('direccion').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('email').trim().notEmpty().isEmail().withMessage('El email debe ser válido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];
