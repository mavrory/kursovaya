const database = require('../config/database');
const { LessonChangeRequest } = require('../models');

class LessonChangeRequestRepository {
    async create(changeRequestData) {
        try {
            const { lesson_id, requester_id, proposed_date, proposed_time, comment } = changeRequestData;
            const result = await database.query(
                `INSERT INTO lesson_change_request 
         (lesson_id, requester_id, proposed_date, proposed_time, comment, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
                [lesson_id, requester_id, proposed_date, proposed_time, comment]
            );
            return new LessonChangeRequest(result.rows[0]);
        } catch (error) {
            console.error('Error creating lesson change request:', error);
            throw error;
        }
    }

    async findById(change_id) {
        try {
            const result = await database.query(
                `SELECT lcr.*, 
                u.name as requester_name,
                l.lesson_date as original_date,
                l.start_time as original_time
         FROM lesson_change_request lcr
         JOIN "user" u ON lcr.requester_id = u.user_id
         JOIN lesson l ON lcr.lesson_id = l.lesson_id
         WHERE lcr.change_id = $1`,
                [change_id]
            );
            return result.rows[0] ? new LessonChangeRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding lesson change request by id:', error);
            throw error;
        }
    }

    async findByLesson(lesson_id) {
        try {
            const result = await database.query(
                `SELECT lcr.*, 
                u.name as requester_name
         FROM lesson_change_request lcr
         JOIN "user" u ON lcr.requester_id = u.user_id
         WHERE lcr.lesson_id = $1
         ORDER BY lcr.date_created DESC`,
                [lesson_id]
            );
            return result.rows.map(row => new LessonChangeRequest(row));
        } catch (error) {
            console.error('Error finding change requests by lesson:', error);
            throw error;
        }
    }

    async findByRequester(requester_id) {
        try {
            const result = await database.query(
                `SELECT lcr.*, 
                u.name as requester_name,
                l.lesson_date as original_date,
                l.start_time as original_time
         FROM lesson_change_request lcr
         JOIN "user" u ON lcr.requester_id = u.user_id
         JOIN lesson l ON lcr.lesson_id = l.lesson_id
         WHERE lcr.requester_id = $1
         ORDER BY lcr.date_created DESC`,
                [requester_id]
            );
            return result.rows.map(row => new LessonChangeRequest(row));
        } catch (error) {
            console.error('Error finding change requests by requester:', error);
            throw error;
        }
    }

    async findByStatus(status) {
        try {
            const result = await database.query(
                `SELECT lcr.*, 
                u.name as requester_name,
                l.lesson_date as original_date,
                l.start_time as original_time
         FROM lesson_change_request lcr
         JOIN "user" u ON lcr.requester_id = u.user_id
         JOIN lesson l ON lcr.lesson_id = l.lesson_id
         WHERE lcr.status = $1
         ORDER BY lcr.date_created DESC`,
                [status]
            );
            return result.rows.map(row => new LessonChangeRequest(row));
        } catch (error) {
            console.error('Error finding change requests by status:', error);
            throw error;
        }
    }

    async updateStatus(change_id, status) {
        try {
            const result = await database.query(
                `UPDATE lesson_change_request 
         SET status = $1 
         WHERE change_id = $2
         RETURNING *`,
                [status, change_id]
            );
            return result.rows[0] ? new LessonChangeRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating change request status:', error);
            throw error;
        }
    }

    async approveRequest(change_id) {
        try {
            // Начинаем транзакцию
            const client = await database.getClient();

            try {
                await client.query('BEGIN');

                // Получаем данные запроса на изменение
                const changeRequest = await client.query(
                    `SELECT * FROM lesson_change_request WHERE change_id = $1`,
                    [change_id]
                );

                if (!changeRequest.rows[0]) {
                    throw new Error('Change request not found');
                }

                const { lesson_id, proposed_date, proposed_time } = changeRequest.rows[0];

                // Обновляем урок
                const updatedLesson = await client.query(
                    `UPDATE lesson 
           SET lesson_date = $1, start_time = $2
           WHERE lesson_id = $3
           RETURNING *`,
                    [proposed_date, proposed_time, lesson_id]
                );

                // Обновляем статус запроса
                const updatedRequest = await client.query(
                    `UPDATE lesson_change_request 
           SET status = 'accepted' 
           WHERE change_id = $1
           RETURNING *`,
                    [change_id]
                );

                await client.query('COMMIT');

                return {
                    lesson: updatedLesson.rows[0],
                    changeRequest: updatedRequest.rows[0]
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error approving change request:', error);
            throw error;
        }
    }

    async rejectRequest(change_id, reason = null) {
        try {
            const result = await database.query(
                `UPDATE lesson_change_request 
         SET status = 'rejected',
             comment = COALESCE($2, comment)
         WHERE change_id = $1
         RETURNING *`,
                [change_id, reason]
            );
            return result.rows[0] ? new LessonChangeRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error rejecting change request:', error);
            throw error;
        }
    }

    async delete(change_id) {
        try {
            const result = await database.query(
                'DELETE FROM lesson_change_request WHERE change_id = $1 RETURNING *',
                [change_id]
            );
            return result.rows[0] ? new LessonChangeRequest(result.rows[0]) : null;
        } catch (error) {
            console.error('Error deleting change request:', error);
            throw error;
        }
    }

    async getPendingCountForLesson(lesson_id) {
        try {
            const result = await database.query(
                `SELECT COUNT(*) as pending_count
         FROM lesson_change_request 
         WHERE lesson_id = $1 AND status = 'pending'`,
                [lesson_id]
            );
            return parseInt(result.rows[0].pending_count);
        } catch (error) {
            console.error('Error getting pending count for lesson:', error);
            throw error;
        }
    }





    async updateWithRescheduleData(lessonId, updateData) {
        try {
            // В текущей структуре таблицы lesson нет полей для статуса переноса
            // Храним данные о переносе только в lesson_change_request

            // Если нужно обновить урок (например, дату), используем существующие поля
            if (updateData.lesson_date && updateData.start_time) {
                const result = await database.query(
                    `UPDATE lesson 
                     SET lesson_date = $1, 
                         start_time = $2,
                         end_time = $3
                     WHERE lesson_id = $4
                     RETURNING *`,
                    [
                        updateData.lesson_date,
                        updateData.start_time,
                        updateData.end_time || updateData.start_time, // Добавляем end_time
                        lessonId
                    ]
                );
                return result.rows[0] || null;
            }

            // Если не обновляем дату, просто возвращаем урок
            return await this.findById(lessonId);
        } catch (error) {
            console.error('Error updating lesson with reschedule data:', error);
            throw error;
        }
    }

    async updateSchedule(lessonId, proposed_date, proposed_time) {
        try {
            // Предполагаем, что урок длится 1 час (стандартное значение)
            const result = await database.query(
                `UPDATE lesson 
                 SET lesson_date = $1, 
                     start_time = $2,
                     end_time = $3::time + interval '1 hour'  -- Добавляем 1 час для end_time
                 WHERE lesson_id = $4
                 RETURNING *`,
                [proposed_date, proposed_time, proposed_time, lessonId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating lesson schedule:', error);
            throw error;
        }
    }

    async getLessonForReschedule(lessonId) {
        try {
            // Получаем урок вместе с информацией о запросе на перенос
            const result = await database.query(
                `SELECT l.*, 
                    lcr.proposed_date,
                    lcr.proposed_time,
                    lcr.status as change_status,
                    lcr.comment as change_comment
                FROM lesson l
                LEFT JOIN lesson_change_request lcr ON l.lesson_id = lcr.lesson_id 
                    AND lcr.status = 'pending'
                WHERE l.lesson_id = $1`,
                [lessonId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting lesson for reschedule:', error);
            throw error;
        }
    }
}

module.exports = new LessonChangeRequestRepository();