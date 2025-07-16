import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

class User {
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(username, email, password) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    try {
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at, updated_at',
        [username, email, password_hash]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        const err = new Error('User with this email or username already exists');
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }
}

export default User;