import { body, param, query, validationResult } from 'express-validator';

// Middleware para manejar los errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validaciones para el registro de usuarios
export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 100 }),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain an uppercase letter, a lowercase letter, a number, and a special character'),
  
  handleValidationErrors
];

// Validaciones para el login de usuarios
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validaciones para registros de peso
export const validateAddWeight = [
  body('weight').isFloat({ min: 1, max: 1000 }).withMessage('Weight must be a number between 1 and 1000'),
  body('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
  body('notes').optional().isLength({ max: 500 }).trim(),
  handleValidationErrors
];

export const validateUpdateWeight = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  ...validateAddWeight
];

export const validateDeleteWeight = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidationErrors
];

export const validateGetWeights = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  handleValidationErrors
];

// Validaciones para metas
export const validateAddGoal = [
  body('target_weight')
    .notEmpty().withMessage('Target weight is required')
    .isFloat({ min: 1, max: 1000 }).withMessage('Target weight must be a number between 1 and 1000'),
  body('target_date')
    .optional()
    .isISO8601().withMessage('Target date must be in YYYY-MM-DD format'),
  handleValidationErrors
];

export const validateUpdateGoal = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  body('target_weight')
    .notEmpty().withMessage('Target weight is required')
    .isFloat({ min: 1, max: 1000 }).withMessage('Target weight must be a number between 1 and 1000'),
  body('target_date')
    .optional()
    .isISO8601().withMessage('Target date must be in YYYY-MM-DD format'),
  handleValidationErrors
];

export const validateDeleteGoal = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidationErrors
];
