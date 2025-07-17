import { Router } from 'express';
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goalsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  validateGoal,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getGoals);
router.post('/', validateGoal, handleValidationErrors, addGoal);
router.put('/:id', validateGoal, handleValidationErrors, updateGoal);
router.delete('/:id', deleteGoal);

export default router;
