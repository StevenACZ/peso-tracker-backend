import { Response, NextFunction } from 'express';
import Goal from '../models/Goal.js';
import { AuthRequest, ApiResponse, Goal as GoalType } from '../types/index.js';

const getGoals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const goals = await Goal.findByUserId(req.user!.id);
    const response: ApiResponse<GoalType[]> = { data: goals };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const addGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { target_weight, current_weight, target_date, notes } = req.body;

    const newGoal = await Goal.create(
      req.user!.id,
      target_weight,
      current_weight,
      target_date,
      notes
    );

    const response: ApiResponse<GoalType> = {
      message: 'Goal created successfully',
      data: newGoal,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

const updateGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { target_weight, current_weight, target_date, notes, is_active } =
      req.body;

    const updatedGoal = await Goal.update(parseInt(id!), req.user!.id, {
      target_weight,
      current_weight,
      target_date,
      notes,
      is_active,
    });

    const response: ApiResponse<GoalType> = {
      message: 'Goal updated successfully',
      data: updatedGoal,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await Goal.delete(parseInt(id!), req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getGoals, addGoal, updateGoal, deleteGoal };
