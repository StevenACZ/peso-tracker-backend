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

  static async findActiveByUserId(userId: number): Promise<GoalType | null> {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async create(
    userId: number,
    targetWeight: number,
    currentWeight: number,
    targetDate: string,
    notes?: string
  ): Promise<GoalType> {
    const result = await pool.query(
      'INSERT INTO goals (user_id, target_weight, current_weight, target_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, targetWeight, currentWeight, targetDate, notes || null]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    userId: number,
    {
      targetWeight,
      currentWeight,
      targetDate,
      notes,
      isActive,
    }: {
      targetWeight?: number;
      currentWeight?: number;
      targetDate?: string;
      notes?: string;
      isActive?: boolean;
    }
  ): Promise<GoalType> {
    const fields: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramCount = 0;

    if (targetWeight !== undefined) {
      paramCount++;
      fields.push(`target_weight = $${paramCount}`);
      values.push(targetWeight);
    }

    if (currentWeight !== undefined) {
      paramCount++;
      fields.push(`current_weight = $${paramCount}`);
      values.push(currentWeight);
    }

    if (targetDate !== undefined) {
      paramCount++;
      fields.push(`target_date = $${paramCount}`);
      values.push(targetDate);
    }

    if (notes !== undefined) {
      paramCount++;
      fields.push(`notes = $${paramCount}`);
      values.push(notes);
    }

    if (isActive !== undefined) {
      paramCount++;
      fields.push(`is_active = $${paramCount}`);
      values.push(isActive);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `UPDATE goals SET ${fields.join(
      ', '
    )} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;

    const result = await pool.query(query, values);
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
