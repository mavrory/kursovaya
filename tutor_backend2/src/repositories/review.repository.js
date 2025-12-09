const database = require('../config/database');
const { Review } = require('../models');

class ReviewRepository {
    async create(reviewData) {
        try {
            const { student_id, tutor_id, lesson_id, rating, comment } = reviewData;
            const result = await database.query(
                `INSERT INTO review (student_id, tutor_id, lesson_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
                [student_id, tutor_id, lesson_id, rating, comment]
            );
            return new Review(result.rows[0]);
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    async findByTutor(tutor_id) {
        try {
            const result = await database.query(
                `SELECT r.*, 
                s.name as student_name,
                t.name as tutor_name
         FROM review r
         JOIN "user" s ON r.student_id = s.user_id
         JOIN "user" t ON r.tutor_id = t.user_id
         WHERE r.tutor_id = $1
         ORDER BY r.date_posted DESC`,
                [tutor_id]
            );
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error('Error finding reviews by tutor:', error);
            throw error;
        }
    }

    async findByStudent(student_id) {
        try {
            const result = await database.query(
                `SELECT r.*, 
                s.name as student_name,
                t.name as tutor_name
         FROM review r
         JOIN "user" s ON r.student_id = s.user_id
         JOIN "user" t ON r.tutor_id = t.user_id
         WHERE r.student_id = $1
         ORDER BY r.date_posted DESC`,
                [student_id]
            );
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error('Error finding reviews by student:', error);
            throw error;
        }
    }

    async getTutorAverageRating(tutor_id) {
        try {
            const result = await database.query(
                `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
         FROM review 
         WHERE tutor_id = $1`,
                [tutor_id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting tutor average rating:', error);
            throw error;
        }
    }

    async updateReview(review_id, updateData) {
        try {
            const { rating, comment } = updateData;
            const result = await database.query(
                `UPDATE review 
         SET rating = COALESCE($1, rating), 
             comment = COALESCE($2, comment)
         WHERE review_id = $3
         RETURNING *`,
                [rating, comment, review_id]
            );
            return result.rows[0] ? new Review(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    async delete(review_id) {
        try {
            const result = await database.query(
                'DELETE FROM review WHERE review_id = $1 RETURNING *',
                [review_id]
            );
            return result.rows[0] ? new Review(result.rows[0]) : null;
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    async findRecentByTutor(tutor_id, days = 7) {
        try {
            const result = await database.query(
                `SELECT r.*, 
                s.name as student_name,
                t.name as tutor_name
         FROM review r
         JOIN "user" s ON r.student_id = s.user_id
         JOIN "user" t ON r.tutor_id = t.user_id
         WHERE r.tutor_id = $1
           AND r.date_posted >= CURRENT_DATE - INTERVAL '${days} days'
         ORDER BY r.date_posted DESC`,
                [tutor_id]
            );
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error('Error finding recent reviews by tutor:', error);
            throw error;
        }
    }

    async findByLesson(lesson_id) {
        try {
            // Получаем review для урока напрямую по lesson_id
            const result = await database.query(
                `SELECT r.*, 
                s.name as student_name,
                t.name as tutor_name
         FROM review r
         JOIN "user" s ON r.student_id = s.user_id
         JOIN "user" t ON r.tutor_id = t.user_id
         WHERE r.lesson_id = $1
         ORDER BY r.date_posted DESC
         LIMIT 1`,
                [lesson_id]
            );
            return result.rows[0] ? new Review(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding review by lesson:', error);
            throw error;
        }
    }

    async findByStudentWithLessonInfo(student_id) {
        try {
            const result = await database.query(
                `SELECT r.*, 
                s.name as student_name,
                t.name as tutor_name,
                sub.name as subject_name
         FROM review r
         JOIN "user" s ON r.student_id = s.user_id
         JOIN "user" t ON r.tutor_id = t.user_id
         LEFT JOIN lesson l ON r.lesson_id = l.lesson_id
         LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         WHERE r.student_id = $1
         ORDER BY r.date_posted DESC`,
                [student_id]
            );
            return result.rows.map(row => new Review(row));
        } catch (error) {
            console.error('Error finding reviews by student with lesson info:', error);
            throw error;
        }
    }

    async findById(review_id) {
        try {
            const result = await database.query(
                `SELECT r.*, 
                s.name as student_name,
                t.name as tutor_name
         FROM review r
         JOIN "user" s ON r.student_id = s.user_id
         JOIN "user" t ON r.tutor_id = t.user_id
         WHERE r.review_id = $1`,
                [review_id]
            );
            return result.rows[0] ? new Review(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding review by id:', error);
            throw error;
        }
    }
}

module.exports = new ReviewRepository();