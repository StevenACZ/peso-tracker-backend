import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { User as UserType } from '../types/index.js';

class User {
  static async create(
    username: string,
    email: string,
    password: string
  ): Promise<UserType> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<UserType | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<UserType | null> {
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
  }
}

export default User;
