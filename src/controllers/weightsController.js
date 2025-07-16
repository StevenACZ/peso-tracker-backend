import WeightRecord from '../models/WeightRecord.js';

const getWeights = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = req.query;
    
    const weights = await WeightRecord.findByUserId(req.user.id, { 
      limit: parseInt(limit), 
      offset: parseInt(offset), 
      startDate, 
      endDate 
    });
    
    const totalCount = await WeightRecord.countByUserId(req.user.id, { startDate, endDate });
    
    res.json({
      data: weights,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + weights.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const addWeight = async (req, res, next) => {
  try {
    const { weight, date, notes } = req.body;

    const newWeight = await WeightRecord.create(
      req.user.id,
      parseFloat(weight),
      date,
      notes || null
    );
    
    res.status(201).json({
      message: 'Weight record created successfully',
      data: newWeight
    });
  } catch (error) {
    next(error);
  }
};

const updateWeight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weight, date, notes } = req.body;

    const updatedWeight = await WeightRecord.update(id, req.user.id, { weight, date, notes });

    res.json({
      message: 'Weight record updated successfully',
      data: updatedWeight
    });
  } catch (error) {
    next(error);
  }
};

const deleteWeight = async (req, res, next) => {
  try {
    const { id } = req.params;
    await WeightRecord.delete(id, req.user.id);
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};

export { getWeights, addWeight, updateWeight, deleteWeight };