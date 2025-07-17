import express from "express";
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
} from "../controllers/goalsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  validateAddGoal,
  validateUpdateGoal,
  validateDeleteGoal,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getGoals);
router.post("/", validateAddGoal, addGoal);
router.put("/:id", validateUpdateGoal, updateGoal);
router.delete("/:id", validateDeleteGoal, deleteGoal);

export default router;
