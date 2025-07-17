import pool from '../config/db.js';
import { WeightRecord as WeightRecordType } from '../types/index.js';

class WeightRecord {
  static async findByUserId(
    userId: number,
    {
      limit,
      offset,
      startDate,
      endDate,
    }: {
      limit: number;
      offset: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<WeightRecordType[]> {
    const queryParams: (string | number)[] = [userId];
    let queryString = 'SELECT * FROM weight_records WHERE user_id = $1';

    if (startDate) {
      queryParams.push(startDate);
      queryString += ` AND date >= $${queryParams.length}`;
    }

    if (endDate) {
      queryParams.push(endDate);
      queryString += ` AND date <= $${queryParams.length}`;
    }

    queryString += ' ORDER BY date DESC';

    queryParams.push(limit);
    queryString += ` LIMIT $${queryParams.length}`;

    queryParams.push(offset);
    queryString += ` OFFSET $${queryParams.length}`;

    const result = await pool.query(queryString, queryParams);
    return result.rows;
  }

  static async countByUserId(
    userId: number,
    { startDate, endDate }: { startDate?: string; endDate?: string }
  ): Promise<number> {
    const queryParams: (string | number)[] = [userId];
    let queryString = 'SELECT COUNT(*) FROM weight_records WHERE user_id = $1';

    if (startDate) {
      queryParams.push(startDate);
      queryString += ` AND date >= $${queryParams.length}`;
    }

    if (endDate) {
      queryParams.push(endDate);
      queryString += ` AND date <= $${queryParams.length}`;
    }

    const result = await pool.query(queryString, queryParams);
    return parseInt(result.rows[0].count);
  }

  static async create(
    userId: number,
    weight: number,
    date: string,
    notes?: string
  ): Promise<WeightRecordType> {
    try {
      const result = await pool.query(
        'INSERT INTO weight_records (user_id, weight, date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, weight, date, notes || null]
      );
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        const err = new Error('A weight record already exists for this date.');
        (err as any).status = 409;
        throw err;
      }
      throw error;
    }
  }

  static async update(
    id: number,
    userId: number,
    { weight, date, notes }: { weight: number; date: string; notes?: string }
  ): Promise<WeightRecordType> {
    const result = await pool.query(
      'UPDATE weight_records SET weight = $1, date = $2, notes = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
      [weight, date, notes || null, id, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Weight record not found or user not authorized');
      (error as any).status = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async delete(id: number, userId: number): Promise<void> {
    const result = await pool.query(
      'DELETE FROM weight_records WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Weight record not found or user not authorized');
      (error as any).status = 404;
      throw error;
    }
  }
}

export default WeightRecord;
