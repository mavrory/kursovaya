const database = require('../config/database');
const { Subject } = require('../models');

class SubjectRepository {
    async findAll() {
        try {
            const result = await database.query('SELECT * FROM subject ORDER BY name');
            return result.rows.map(row => new Subject(row));
        } catch (error) {
            console.error('Error finding subjects:', error);
            throw error;
        }
    }

    async findById(subject_id) {
        try {
            const result = await database.query(
                'SELECT * FROM subject WHERE subject_id = $1',
                [subject_id]
            );
            return result.rows[0] ? new Subject(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding subject by id:', error);
            throw error;
        }
    }

    async create(subjectData) {
        try {
            const { name, description } = subjectData;
            const result = await database.query(
                `INSERT INTO subject(name, description)
         VALUES ($1, $2)
         RETURNING *`,
                [name, description]
            );
            return new Subject(result.rows[0]);
        } catch (error) {
            console.error('Error creating subject:', error);
            // Обрабатываем ошибки уникальности
            if (error.code === '23505') { // PostgreSQL unique violation
                if (error.constraint === 'subject_pkey') {
                    throw new Error('Subject with this ID already exists');
                } else if (error.constraint && error.constraint.includes('name')) {
                    throw new Error('Subject with this name already exists');
                } else {
                    throw new Error('Subject with this name already exists');
                }
            }
            throw error;
        }
    }

    async update(subject_id, updateData) {
        try {
            const { name, description } = updateData;
            const result = await database.query(
                `UPDATE subject 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description)
         WHERE subject_id = $3
         RETURNING *`,
                [name, description, subject_id]
            );
            return result.rows[0] ? new Subject(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating subject:', error);
            throw error;
        }
    }

    async delete(subject_id) {
        try {
            const result = await database.query(
                'DELETE FROM subject WHERE subject_id = $1 RETURNING *',
                [subject_id]
            );
            return result.rows[0] ? new Subject(result.rows[0]) : null;
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    }

}

module.exports = new SubjectRepository();