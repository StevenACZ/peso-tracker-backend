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
    
    // Log the entire request for debugging
    console.log('Full request:', {
      body: req.body,
      params: req.params,
      headers: req.headers
    });
    
    // Check if body is empty or not properly parsed
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('WARNING: Request body is empty or not parsed correctly');
      return res.status(400).json({ error: 'Request body is empty or invalid' });
    }
    
    const { target_weight, target_date } = req.body;
    
    console.log('Extracted values:', { 
      target_weight, 
      target_date,
      target_weight_type: typeof target_weight,
      target_date_type: typeof target_date
    });

    if (target_weight === undefined || target_weight === null) {
      return res.status(400).json({ error: 'target_weight is required and cannot be null' });
    }

    // Convert to number if it's a string
    const parsedWeight = typeof target_weight === 'string' ? parseFloat(target_weight) : target_weight;
    
    if (isNaN(parsedWeight)) {
      return res.status(400).json({ error: 'target_weight must be a valid number' });
    }
    
    console.log('Parsed weight:', parsedWeight);

    const updatedGoal = await Goal.update(id, req.user.id, { 
      target_weight: parsedWeight, 
      target_date 
    });
    
    res.json({ message: 'Goal updated successfully', data: updatedGoal });
  } catch (error) {
    console.error('Error in updateGoal:', error);
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
