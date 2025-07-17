import { Response, NextFunction } from 'express';
import WeightRecord from '../models/WeightRecord.js';
import {
  AuthRequest,
  ApiResponse,
  WeightRecord as WeightRecordType,
} from '../types/index.js';

const getWeights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = '50', offset = '0', startDate, endDate } = req.query;

    const weights = await WeightRecord.findByUserId(req.user!.id, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      startDate: startDate as string,
      endDate: endDate as string,
    });

    const totalCount = await WeightRecord.countByUserId(req.user!.id, {
      startDate: startDate as string,
      endDate: endDate as string,
    });

    const response: ApiResponse<WeightRecordType[]> = {
      data: weights,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + weights.length,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const addWeight = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { weight, date, notes } = req.body;

    const newWeight = await WeightRecord.create(
      req.user!.id,
      parseFloat(weight),
      date,
      notes || null
    );

    const response: ApiResponse<WeightRecordType> = {
      message: 'Weight record created successfully',
      data: newWeight,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

const updateWeight = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { weight, date, notes } = req.body;

    const updatedWeight = await WeightRecord.update(
      parseInt(id!),
      req.user!.id,
      {
        weight,
        date,
        notes,
      }
    );

    const response: ApiResponse<WeightRecordType> = {
      message: 'Weight record updated successfully',
      data: updatedWeight,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const deleteWeight = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await WeightRecord.delete(parseInt(id!), req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getWeights, addWeight, updateWeight, deleteWeight };
