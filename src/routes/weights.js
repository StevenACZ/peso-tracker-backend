import express from 'express';
import {
  getWeights,
  addWeight,
  updateWeight,
  deleteWeight,
} from '../controllers/weightsController.js';
import {
  validateGetWeights,
  validateAddWeight,
  validateUpdateWeight,
  validateDeleteWeight,
} from '../middleware/validationMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplica autenticación a todas las rutas de pesos
router.use(authMiddleware);

router.get('/', validateGetWeights, getWeights);
router.post('/', validateAddWeight, addWeight);
router.put('/:id', validateUpdateWeight, updateWeight);
router.delete('/:id', validateDeleteWeight, deleteWeight);

export default router;