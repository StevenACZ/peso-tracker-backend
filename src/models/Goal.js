import pool from '../config/db.js';

class Goal {
  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async create(userId, targetWeight, targetDate) {
    const result = await pool.query(
      'INSERT INTO goals (user_id, target_weight, target_date) VALUES ($1, $2, $3) RETURNING *',
      [userId, targetWeight, targetDate]
    );
    return result.rows[0];
  }

  static async update(id, userId, { target_weight, target_date }) {
    const result = await pool.query(
      'UPDATE goals SET target_weight = $1, target_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [target_weight, target_date, id, userId]
    );
    if (result.rowCount === 0) {
      throw new Error('Goal not found or user not authorized');
    }
    return result.rows[0];
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      throw new Error('Goal not found or user not authorized');
    }
  }
}

export default Goal;
