const database = require('../config/database');
const TutorSchedule = require('../models/TutorSchedule');

class TutorScheduleRepository {
    /**
     * Создает новый слот в расписании
     */
    async create(scheduleData) {
        try {
            const { 
                tutor_id, 
                schedule_date, 
                start_time, 
                end_time, 
                status = 'blocked',
                reason,
                is_recurring = false,
                recurring_pattern
            } = scheduleData;

            const result = await database.query(
                `INSERT INTO tutor_schedule 
                (tutor_id, schedule_date, start_time, end_time, status, reason, is_recurring, recurring_pattern)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [tutor_id, schedule_date, start_time, end_time, status, reason, is_recurring, recurring_pattern]
            );
            return new TutorSchedule(result.rows[0]);
        } catch (error) {
            console.error('Error creating tutor schedule:', error);
            throw error;
        }
    }

    /**
     * Создает несколько слотов за раз (для блокировки нескольких временных слотов)
     */
    async createMultiple(scheduleItems) {
        try {
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            scheduleItems.forEach((item, index) => {
                const { tutor_id, schedule_date, start_time, end_time, status = 'blocked', reason } = item;
                placeholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
                );
                values.push(tutor_id, schedule_date, start_time, end_time, status, reason || null, false, null);
                paramIndex += 8;
            });

            const query = `
                INSERT INTO tutor_schedule 
                (tutor_id, schedule_date, start_time, end_time, status, reason, is_recurring, recurring_pattern)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (tutor_id, schedule_date, start_time) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    reason = EXCLUDED.reason,
                    date_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;

            const result = await database.query(query, values);
            return result.rows.map(row => new TutorSchedule(row));
        } catch (error) {
            console.error('Error creating multiple tutor schedules:', error);
            throw error;
        }
    }

    /**
     * Получает все слоты расписания для репетитора
     */
    async findByTutor(tutor_id, startDate = null, endDate = null) {
        try {
            let query = `
                SELECT * FROM tutor_schedule
                WHERE tutor_id = $1
            `;
            const params = [tutor_id];

            if (startDate) {
                query += ` AND schedule_date >= $${params.length + 1}`;
                params.push(startDate);
            }

            if (endDate) {
                query += ` AND schedule_date <= $${params.length + 1}`;
                params.push(endDate);
            }

            query += ` ORDER BY schedule_date ASC, start_time ASC`;

            const result = await database.query(query, params);
            return result.rows.map(row => new TutorSchedule(row));
        } catch (error) {
            console.error('Error finding tutor schedule by tutor:', error);
            throw error;
        }
    }

    /**
     * Получает слоты по дате и статусу
     */
    async findByDateAndStatus(tutor_id, schedule_date, status = null) {
        try {
            let query = `
                SELECT * FROM tutor_schedule
                WHERE tutor_id = $1 AND schedule_date = $2
            `;
            const params = [tutor_id, schedule_date];

            if (status) {
                query += ` AND status = $3`;
                params.push(status);
            }

            query += ` ORDER BY start_time ASC`;

            const result = await database.query(query, params);
            return result.rows.map(row => new TutorSchedule(row));
        } catch (error) {
            console.error('Error finding tutor schedule by date and status:', error);
            throw error;
        }
    }

    /**
     * Удаляет слот из расписания
     */
    async delete(schedule_id) {
        try {
            const result = await database.query(
                'DELETE FROM tutor_schedule WHERE schedule_id = $1 RETURNING *',
                [schedule_id]
            );
            return result.rows[0] ? new TutorSchedule(result.rows[0]) : null;
        } catch (error) {
            console.error('Error deleting tutor schedule:', error);
            throw error;
        }
    }

    /**
     * Удаляет все заблокированные слоты для репетитора на определенную дату
     */
    async deleteByDateAndStatus(tutor_id, schedule_date, status = 'blocked') {
        try {
            const result = await database.query(
                `DELETE FROM tutor_schedule 
                WHERE tutor_id = $1 AND schedule_date = $2 AND status = $3
                RETURNING *`,
                [tutor_id, schedule_date, status]
            );
            return result.rows.map(row => new TutorSchedule(row));
        } catch (error) {
            console.error('Error deleting tutor schedule by date and status:', error);
            throw error;
        }
    }

    /**
     * Обновляет статус слота
     */
    async updateStatus(schedule_id, status) {
        try {
            const result = await database.query(
                `UPDATE tutor_schedule 
                SET status = $1, date_updated = CURRENT_TIMESTAMP
                WHERE schedule_id = $2
                RETURNING *`,
                [status, schedule_id]
            );
            return result.rows[0] ? new TutorSchedule(result.rows[0]) : null;
        } catch (error) {
            console.error('Error updating tutor schedule status:', error);
            throw error;
        }
    }
}

module.exports = new TutorScheduleRepository();

