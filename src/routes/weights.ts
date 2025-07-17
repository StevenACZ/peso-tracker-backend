import { Router } from 'express';
import {
  getWeights,
  addWeight,
  updateWeight,
  deleteWeight,
} from '../controllers/weightsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  validateWeightRecord,
  validateWeightUpdate,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getWeights);
router.post('/', validateWeightRecord, handleValidationErrors, addWeight);
router.put('/:id', validateWeightUpdate, handleValidationErrors, updateWeight);
router.delete('/:id', deleteWeight);

export default router;
