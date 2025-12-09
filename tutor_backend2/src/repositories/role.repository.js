const database = require('../config/database');
const { Role } = require('../models');

class RoleRepository {
    async findAll() {
        try {
            const result = await database.query('SELECT * FROM role ORDER BY role_id');
            return result.rows.map(row => new Role(row));
        } catch (error) {
            console.error('Error finding roles:', error);
            throw error;
        }
    }

    async findById(role_id) {
        try {
            const result = await database.query(
                'SELECT * FROM role WHERE role_id = $1',
                [role_id]
            );
            return result.rows[0] ? new Role(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding role by id:', error);
            throw error;
        }
    }

    async findByName(role_name) {
        try {
            const result = await database.query(
                'SELECT * FROM role WHERE role_name = $1',
                [role_name]
            );
            return result.rows[0] ? new Role(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding role by name:', error);
            throw error;
        }
    }
}

module.exports = new RoleRepository();