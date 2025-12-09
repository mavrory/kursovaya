const database = require('../config/database');
const { User } = require('../models');

class UserRepository {
    async findByEmail(email) {
        try {
            const result = await database.query(
                `SELECT u.*, r.role_name 
         FROM "user" u 
         JOIN role r ON u.role_id = r.role_id 
         WHERE u.email = $1`,
                [email]
            );
            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    async findById(user_id) {
        try {
            const result = await database.query(
                `SELECT u.*, r.role_name 
         FROM "user" u 
         JOIN role r ON u.role_id = r.role_id 
         WHERE u.user_id = $1`,
                [user_id]
            );
            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    async create(userData) {
        try {
            const { name, email, password_hash, role_id } = userData;
            const result = await database.query(
                `INSERT INTO "user"(name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, name, email, role_id, date_registered`,
                [name, email, password_hash, role_id]
            );
            return new User(result.rows[0]);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async update(user_id, updateData) {
        try {
            const { name, email, is_blocked } = updateData;
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                values.push(name);
                paramIndex++;
            }
            if (email !== undefined) {
                updates.push(`email = $${paramIndex}`);
                values.push(email);
                paramIndex++;
            }
            if (is_blocked !== undefined) {
                updates.push(`is_blocked = $${paramIndex}`);
                values.push(is_blocked);
                paramIndex++;
            }

            if (updates.length === 0) {
                return await this.findById(user_id);
            }

            values.push(user_id);
            const result = await database.query(
                `UPDATE "user" 
         SET ${updates.join(', ')}
         WHERE user_id = $${paramIndex}
         RETURNING *`,
                values
            );
            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async getUserRole(user_id) {
        try {
            const result = await database.query(
                `SELECT r.role_name 
         FROM "user" u 
         JOIN role r ON u.role_id = r.role_id 
         WHERE u.user_id = $1`,
                [user_id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user role:', error);
            throw error;
        }
    }

    async getAll(role_id = null, exclude_user_id = null) {
        try {
            let query = `SELECT u.*, r.role_name FROM "user" u JOIN role r ON u.role_id = r.role_id`;
            const params = [];
            const conditions = [];

            if (role_id) {
                conditions.push(`u.role_id = $${params.length + 1}`);
                params.push(role_id);
            }

            if (exclude_user_id) {
                conditions.push(`u.user_id != $${params.length + 1}`);
                params.push(exclude_user_id);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY u.date_registered DESC';

            const result = await database.query(query, params);
            return result.rows.map(row => new User(row));
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
}

module.exports = new UserRepository();