const database = require('../config/database');
const { Lesson } = require('../models');

class LessonRepository {
    async create(lessonData) {
        try {
            const { request_id, tutor_id, student_id, lesson_date, start_time, end_time } = lessonData;
            const result = await database.query(
                `INSERT INTO lesson (request_id, tutor_id, student_id, lesson_date, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
                [request_id, tutor_id, student_id, lesson_date, start_time, end_time]
            );
            return new Lesson(result.rows[0]);
        } catch (error) {
            console.error('Error creating lesson:', error);
            throw error;
        }
    }

    async findById(lesson_id) {
        try {
            const result = await database.query(
                `SELECT l.*, 
                s.user_id as student_user_id,
                s.name as student_name,
                s.email as student_email,
                t.user_id as tutor_user_id,
                t.name as tutor_name,
                t.email as tutor_email,
                lr.status as request_status,
                lr.subject_id,
                sub.subject_id as subject_id_full,
                sub.name as subject_name,
                tp.price_per_hour,
                tp.rating_avg as tutor_rating
         FROM lesson l
         JOIN "user" s ON l.student_id = s.user_id
         JOIN "user" t ON l.tutor_id = t.user_id
         LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
         WHERE l.lesson_id = $1`,
                [lesson_id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding lesson by id:', error);
            throw error;
        }
    }

    async findByStudent(student_id) {
        try {
            const result = await database.query(
                `SELECT l.*, 
                s.user_id as student_user_id,
                s.name as student_name,
                s.email as student_email,
                t.user_id as tutor_user_id,
                t.name as tutor_name,
                t.email as tutor_email,
                lr.status as request_status,
                lr.subject_id,
                sub.subject_id as subject_id_full,
                sub.name as subject_name,
                tp.price_per_hour,
                tp.rating_avg as tutor_rating
         FROM lesson l
         JOIN "user" s ON l.student_id = s.user_id
         JOIN "user" t ON l.tutor_id = t.user_id
         LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
         WHERE l.student_id = $1
         ORDER BY l.lesson_date DESC, l.start_time DESC`,
                [student_id]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding lessons by student:', error);
            throw error;
        }
    }

    async findByTutor(tutor_id) {
        try {
            const result = await database.query(
                `SELECT l.*, 
                s.user_id as student_user_id,
                s.name as student_name,
                s.email as student_email,
                t.user_id as tutor_user_id,
                t.name as tutor_name,
                t.email as tutor_email,
                lr.status as request_status,
                lr.subject_id,
                sub.subject_id as subject_id_full,
                sub.name as subject_name,
                tp.price_per_hour,
                tp.rating_avg as tutor_rating
         FROM lesson l
         JOIN "user" s ON l.student_id = s.user_id
         JOIN "user" t ON l.tutor_id = t.user_id
         LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
         WHERE l.tutor_id = $1
         ORDER BY l.lesson_date DESC, l.start_time DESC`,
                [tutor_id]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding lessons by tutor:', error);
            throw error;
        }
    }

    async updateCompletion(lesson_id, is_completed) {
        try {
            const result = await database.query(
                `UPDATE lesson 
         SET is_completed = $1 
         WHERE lesson_id = $2
         RETURNING *`,
                [is_completed, lesson_id]
            );
            return result.rows[0] ? new Lesson(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating lesson completion:', error);
            throw error;
        }
    }

    async getUpcomingLessons(user_id, role) {
        try {
            // Используем безопасный способ для выбора поля
            const field = role === 'tutor' ? 'tutor_id' : 'student_id';
            let query;
            
            if (role === 'tutor') {
                query = `SELECT l.*, 
                    s.user_id as student_user_id,
                    s.name as student_name,
                    t.user_id as tutor_user_id,
                    t.name as tutor_name,
                    lr.status as request_status,
                    lr.subject_id,
                    sub.subject_id as subject_id_full,
                    sub.name as subject_name,
                    tp.price_per_hour,
                    tp.rating_avg as tutor_rating
             FROM lesson l
             JOIN "user" s ON l.student_id = s.user_id
             JOIN "user" t ON l.tutor_id = t.user_id
             LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
             LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
             LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
             WHERE l.tutor_id = $1 
               AND l.lesson_date >= CURRENT_DATE
               AND l.is_completed = false
             ORDER BY l.lesson_date ASC, l.start_time ASC`;
            } else {
                query = `SELECT l.*, 
                    s.user_id as student_user_id,
                    s.name as student_name,
                    t.user_id as tutor_user_id,
                    t.name as tutor_name,
                    lr.status as request_status,
                    lr.subject_id,
                    sub.subject_id as subject_id_full,
                    sub.name as subject_name,
                    tp.price_per_hour,
                    tp.rating_avg as tutor_rating
             FROM lesson l
             JOIN "user" s ON l.student_id = s.user_id
             JOIN "user" t ON l.tutor_id = t.user_id
             LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
             LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
             LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
             WHERE l.student_id = $1 
               AND l.lesson_date >= CURRENT_DATE
               AND l.is_completed = false
             ORDER BY l.lesson_date ASC, l.start_time ASC`;
            }
            
            const result = await database.query(query, [user_id]);
            return result.rows;
        } catch (error) {
            console.error('Error getting upcoming lessons:', error);
            throw error;
        }
    }

    async getLessonWithDetails(lesson_id) {
        try {
            const result = await database.query(
                `SELECT l.*, 
                s.user_id as student_user_id,
                s.name as student_name,
                s.email as student_email,
                t.user_id as tutor_user_id,
                t.name as tutor_name,
                t.email as tutor_email,
                lr.status as request_status,
                lr.subject_id,
                sub.subject_id as subject_id_full,
                sub.name as subject_name,
                tp.price_per_hour,
                tp.rating_avg as tutor_rating
         FROM lesson l
         JOIN "user" s ON l.student_id = s.user_id
         JOIN "user" t ON l.tutor_id = t.user_id
         LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
         WHERE l.lesson_id = $1`,
                [lesson_id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting lesson with details:', error);
            throw error;
        }
    }





    // async update(lessonId, updateData) {
    //     try {
    //         const setClauses = [];
    //         const values = [];
    //         let paramIndex = 1;
    //
    //         // Динамически строим SET часть запроса
    //         for (const [key, value] of Object.entries(updateData)) {
    //             setClauses.push(`${key} = $${paramIndex}`);
    //             values.push(value);
    //             paramIndex++;
    //         }
    //
    //         if (setClauses.length === 0) {
    //             throw new Error('No fields to update');
    //         }
    //
    //         values.push(lessonId);
    //
    //         const query = `
    //             UPDATE lesson
    //             SET ${setClauses.join(', ')}
    //             WHERE lesson_id = $${paramIndex}
    //                 RETURNING *
    //         `;
    //
    //         const result = await database.query(query, values);
    //         return result.rows[0] || null;
    //     } catch (error) {
    //         console.error('Error updating lesson:', error);
    //         throw error;
    //     }
    // }

    async updateSchedule(lessonId, proposed_date, proposed_time) {
        try {
            const result = await database.query(
                `UPDATE lesson 
                 SET lesson_date = $1, 
                     start_time = $2,
                     status = 'scheduled',
                     proposed_date = NULL,
                     proposed_time = NULL,
                     comment = NULL
                 WHERE lesson_id = $3
                 RETURNING *`,
                [proposed_date, proposed_time, lessonId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating lesson schedule:', error);
            throw error;
        }
    }

    async updateLessonStatus(lessonId, status) {
        try {
            const result = await database.query(
                `UPDATE lesson 
                 SET status = $1 
                 WHERE lesson_id = $2
                 RETURNING *`,
                [status, lessonId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating lesson status:', error);
            throw error;
        }
    }

    async updateWithRescheduleData(lessonId, updateData) {
        try {
            const result = await database.query(
                `UPDATE lesson 
                 SET status = $1,
                     proposed_date = $2,
                     proposed_time = $3,
                     comment = $4
                 WHERE lesson_id = $5
                 RETURNING *`,
                [
                    updateData.status || 'reschedule_pending',
                    updateData.proposed_date,
                    updateData.proposed_time,
                    updateData.comment || null,
                    lessonId
                ]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating lesson with reschedule data:', error);
            throw error;
        }
    }

    async getUpcomingWithPendingRequests(userId, role) {
        try {
            const isTutor = role === 'tutor';
            const field = isTutor ? 'tutor_id' : 'student_id';

            const query = `
                SELECT 
                    l.*,
                    s.user_id as student_user_id,
                    s.name as student_name,
                    s.email as student_email,
                    t.user_id as tutor_user_id,
                    t.name as tutor_name,
                    t.email as tutor_email,
                    lr.status as request_status,
                    lr.subject_id,
                    sub.subject_id as subject_id_full,
                    sub.name as subject_name,
                    tp.price_per_hour,
                    tp.rating_avg as tutor_rating,
                    -- Информация о pending запросе на перенос
                    lcr.change_id,
                    lcr.proposed_date,
                    lcr.proposed_time,
                    lcr.comment as change_comment,
                    lcr.requester_id,
                    lcr.status as change_status,
                    -- Определяем, является ли текущий пользователь ответчиком
                    CASE 
                        WHEN lcr.requester_id = l.student_id THEN l.tutor_id
                        WHEN lcr.requester_id = l.tutor_id THEN l.student_id
                        ELSE NULL
                    END as responder_id
                FROM lesson l
                JOIN "user" s ON l.student_id = s.user_id
                JOIN "user" t ON l.tutor_id = t.user_id
                LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
                LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
                LEFT JOIN tutor_profile tp ON l.tutor_id = tp.tutor_id
                LEFT JOIN lesson_change_request lcr ON l.lesson_id = lcr.lesson_id 
                    AND lcr.status = 'pending'
                WHERE l.${field} = $1 
                  AND l.lesson_date >= CURRENT_DATE
                  AND l.is_completed = false
                ORDER BY l.lesson_date ASC, l.start_time ASC
            `;

            const result = await database.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error('Error getting lessons with pending requests:', error);
            throw error;
        }
    }

    async update(lessonId, updateData) {
        try {
            const setClauses = [];
            const values = [];
            let paramIndex = 1;

            // Динамически строим SET часть запроса
            for (const [key, value] of Object.entries(updateData)) {
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }

            if (setClauses.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(lessonId);

            const query = `
                UPDATE lesson 
                SET ${setClauses.join(', ')}
                WHERE lesson_id = $${paramIndex}
                RETURNING *
            `;

            const result = await database.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating lesson:', error);
            throw error;
        }
    }

    async updateSchedule(lessonId, proposed_date, proposed_time) {
        try {
            // Предполагаем, что урок длится 1 час
            const endTime = `${parseInt(proposed_time.split(':')[0]) + 1}:${proposed_time.split(':')[1]}:00`;

            const result = await database.query(
                `UPDATE lesson 
                 SET lesson_date = $1, 
                     start_time = $2,
                     end_time = $3
                 WHERE lesson_id = $4
                 RETURNING *`,
                [proposed_date, proposed_time, endTime, lessonId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating lesson schedule:', error);
            throw error;
        }
    }
}

module.exports = new LessonRepository();