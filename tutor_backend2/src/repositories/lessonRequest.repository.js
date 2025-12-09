const database = require('../config/database');
const { LessonRequest } = require('../models');

class LessonRequestRepository {
    async create(requestData) {
        try {
            const { student_id, tutor_id, subject_id, scheduled_time } = requestData;
            const result = await database.query(
                `INSERT INTO lesson_request (student_id, tutor_id, subject_id, scheduled_time, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
                [student_id, tutor_id, subject_id, scheduled_time]
            );
            return new LessonRequest(result.rows[0]);
        } catch (error) {
            console.error('Error creating lesson request:', error);
            throw error;
        }
    }

    async findById(request_id) {
        try {
            const result = await database.query(
                `SELECT lr.*, 
                s.name as student_name,
                t.name as tutor_name,
                sub.name as subject_name
         FROM lesson_request lr
         JOIN "user" s ON lr.student_id = s.user_id
         JOIN "user" t ON lr.tutor_id = t.user_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         WHERE lr.request_id = $1`,
                [request_id]
            );
            return result.rows[0] ? new LessonRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding lesson request by id:', error);
            throw error;
        }
    }

    async findByStudent(student_id) {
        try {
            const result = await database.query(
                `SELECT lr.*, 
                s.name as student_name,
                s.email as student_email,
                t.name as tutor_name,
                t.email as tutor_email,
                sub.name as subject_name,
                tp.price_per_hour,
                tp.rating_avg as tutor_rating
         FROM lesson_request lr
         JOIN "user" s ON lr.student_id = s.user_id
         JOIN "user" t ON lr.tutor_id = t.user_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         LEFT JOIN tutor_profile tp ON lr.tutor_id = tp.tutor_id
         WHERE lr.student_id = $1
         ORDER BY lr.date_created DESC`,
                [student_id]
            );
            return result.rows.map(row => new LessonRequest(row));
        } catch (error) {
            console.error('Error finding lesson requests by student:', error);
            throw error;
        }
    }

    async findByTutor(tutor_id) {
        try {
            const result = await database.query(
                `SELECT lr.*, 
                s.name as student_name,
                s.email as student_email,
                t.name as tutor_name,
                t.email as tutor_email,
                sub.name as subject_name,
                tp.price_per_hour,
                tp.rating_avg as tutor_rating
         FROM lesson_request lr
         JOIN "user" s ON lr.student_id = s.user_id
         JOIN "user" t ON lr.tutor_id = t.user_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         LEFT JOIN tutor_profile tp ON lr.tutor_id = tp.tutor_id
         WHERE lr.tutor_id = $1
         ORDER BY lr.date_created DESC`,
                [tutor_id]
            );
            return result.rows.map(row => new LessonRequest(row));
        } catch (error) {
            console.error('Error finding lesson requests by tutor:', error);
            throw error;
        }
    }

    async updateStatus(request_id, status) {
        try {
            const result = await database.query(
                `UPDATE lesson_request 
         SET status = $1 
         WHERE request_id = $2
         RETURNING *`,
                [status, request_id]
            );
            return result.rows[0] ? new LessonRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating lesson request status:', error);
            throw error;
        }
    }

    async delete(request_id) {
        try {
            const result = await database.query(
                'DELETE FROM lesson_request WHERE request_id = $1 RETURNING *',
                [request_id]
            );
            return result.rows[0] ? new LessonRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error deleting lesson request:', error);
            throw error;
        }
    }
}

module.exports = new LessonRequestRepository();