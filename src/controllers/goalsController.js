import Goal from '../models/Goal.js';

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.findByUserId(req.user.id);
    res.json({ data: goals });
  } catch (error) {
    next(error);
  }
};

const addGoal = async (req, res, next) => {
  try {
    const { target_weight, target_date } = req.body;
    const newGoal = await Goal.create(req.user.id, target_weight, target_date);
    res.status(201).json({ message: 'Goal created successfully', data: newGoal });
  } catch (error) {
    next(error);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { target_weight, target_date } = req.body;

    if (target_weight == null) {
      return res.status(400).json({ error: 'target_weight is required' });
    }

    const updatedGoal = await Goal.update(id, req.user.id, { target_weight, target_date });
    res.json({ message: 'Goal updated successfully', data: updatedGoal });
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Goal.delete(id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getGoals, addGoal, updateGoal, deleteGoal };
