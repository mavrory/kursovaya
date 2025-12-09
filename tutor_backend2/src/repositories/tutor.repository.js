const database = require('../config/database');
const { TutorProfile } = require('../models');

class TutorRepository {
    async createProfile(tutorData) {
        try {
            const { tutor_id, subject_id, experience, price_per_hour } = tutorData;
            const result = await database.query(
                `INSERT INTO tutor_profile(tutor_id, subject_id, experience, price_per_hour)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [tutor_id, subject_id, experience, price_per_hour]
            );
            return new TutorProfile(result.rows[0]);
        } catch (error) {
            console.error('Error creating tutor profile:', error);
            throw error;
        }
    }

    async findById(tutor_id) {
        try {
            const result = await database.query(
                `SELECT tp.*, u.name, u.email, s.name as subject_name
         FROM tutor_profile tp
         JOIN "user" u ON tp.tutor_id = u.user_id
         LEFT JOIN subject s ON tp.subject_id = s.subject_id
         WHERE tp.tutor_id = $1`,
                [tutor_id]
            );
            return result.rows[0] ? new TutorProfile(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding tutor by id:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const result = await database.query(
                `SELECT tp.*, u.name, u.email, s.name as subject_name
         FROM tutor_profile tp
         JOIN "user" u ON tp.tutor_id = u.user_id
         LEFT JOIN subject s ON tp.subject_id = s.subject_id
         ORDER BY tp.rating_avg DESC`
            );
            return result.rows.map(row => new TutorProfile(row));
        } catch (error) {
            console.error('Error finding all tutors:', error);
            throw error;
        }
    }

    async updateRating(tutor_id, newRating) {
        try {
            const result = await database.query(
                `UPDATE tutor_profile 
         SET rating_avg = $1 
         WHERE tutor_id = $2
         RETURNING *`,
                [newRating, tutor_id]
            );
            return result.rows[0] ? new TutorProfile(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating tutor rating:', error);
            throw error;
        }
    }
}

module.exports = new TutorRepository();