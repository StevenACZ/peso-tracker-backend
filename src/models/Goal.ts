import pool from '../config/db.js';
import { Goal as GoalType } from '../types/index.js';

class Goal {
  static async findByUserId(userId: number): Promise<GoalType[]> {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async create(
    userId: number,
    target_weight: number,
    target_date?: string
  ): Promise<GoalType> {
    const result = await pool.query(
      'INSERT INTO goals (user_id, target_weight, target_date) VALUES ($1, $2, $3) RETURNING *',
      [userId, target_weight, target_date || null]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    userId: number,
    {
      target_weight,
      target_date,
    }: {
      target_weight?: number;
      target_date?: string;
    }
  ): Promise<GoalType> {
    const result = await pool.query(
      'UPDATE goals SET target_weight = $1, target_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [target_weight, target_date, id, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Goal not found or user not authorized');
      (error as any).status = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async delete(id: number, userId: number): Promise<void> {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Goal not found or user not authorized');
      (error as any).status = 404;
      throw error;
    }
  }
}

export default Goal;