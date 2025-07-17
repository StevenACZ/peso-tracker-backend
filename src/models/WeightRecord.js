import pool from '../config/db.js';

class WeightRecord {
  static async findByUserId(userId, { limit, offset, startDate, endDate }) {
    const queryParams = [userId];
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

    // Asegurar que LIMIT y OFFSET sean pasados correctamente
    queryParams.push(limit);
    queryString += ` LIMIT $${queryParams.length}`;

    queryParams.push(offset);
    queryString += ` OFFSET $${queryParams.length}`;

    const result = await pool.query(queryString, queryParams);
    return result.rows;
  }

  static async countByUserId(userId, { startDate, endDate }) {
    const queryParams = [userId];
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
    return result.rows[0].count;
  }

  static async create(userId, weight, date, notes) {
    try {
      const result = await pool.query(
        'INSERT INTO weight_records (user_id, weight, date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, weight, date, notes]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // unique_violation on user_id and date
        const err = new Error('A weight record already exists for this date.');
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }

  static async update(id, userId, { weight, date, notes }) {
    const result = await pool.query(
      'UPDATE weight_records SET weight = $1, date = $2, notes = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
      [weight, date, notes, id, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Weight record not found or user not authorized');
      error.status = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM weight_records WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Weight record not found or user not authorized');
      error.status = 404;
      throw error;
    }
  }
}

export default WeightRecord;