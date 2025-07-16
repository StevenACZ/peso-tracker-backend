import express from 'express';
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goalsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
// TODO: Add validation middleware for goals

const router = express.Router();

router.use(authMiddleware);

router.get('/', getGoals);
router.post('/', addGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
