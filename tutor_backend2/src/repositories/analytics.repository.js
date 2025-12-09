const database = require('../config/database');
const { AnalyticsReport } = require('../models');

class AnalyticsRepository {
    async createReport(reportData) {
        try {
            const { generated_by, avg_rating, avg_satisfaction, top_tutor_id } = reportData;
            const result = await database.query(
                `INSERT INTO analytics_report (generated_by, avg_rating, avg_satisfaction, top_tutor_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [generated_by, avg_rating, avg_satisfaction, top_tutor_id]
            );
            return new AnalyticsReport(result.rows[0]);
        } catch (error) {
            console.error('Error creating analytics report:', error);
            throw error;
        }
    }

    async getRecentReports(limit = 5) {
        try {
            const result = await database.query(
                `SELECT ar.*, 
                u.name as generated_by_name,
                t.name as top_tutor_name
         FROM analytics_report ar
         LEFT JOIN "user" u ON ar.generated_by = u.user_id
         LEFT JOIN "user" t ON ar.top_tutor_id = t.user_id
         ORDER BY ar.date_generated DESC
         LIMIT $1`,
                [limit]
            );
            return result.rows.map(row => new AnalyticsReport(row));
        } catch (error) {
            console.error('Error getting recent reports:', error);
            throw error;
        }
    }

    async getPlatformStats() {
        try {
            const stats = await database.query(`
        SELECT 
          (SELECT COUNT(*) FROM "user" WHERE role_id = 1) as total_students,
          (SELECT COUNT(*) FROM "user" WHERE role_id = 2) as total_tutors,
          (SELECT COUNT(*) FROM lesson WHERE is_completed = true) as completed_lessons,
          (SELECT COUNT(*) FROM lesson_request WHERE status = 'pending') as pending_requests,
          (SELECT AVG(rating) FROM review) as platform_avg_rating,
          (SELECT AVG(satisfaction_level) FROM survey) as platform_avg_satisfaction
      `);
            return stats.rows[0];
        } catch (error) {
            console.error('Error getting platform stats:', error);
            throw error;
        }
    }

    async getSubjectPopularity() {
        try {
            const result = await database.query(`
        SELECT s.subject_id, s.name, COUNT(lr.request_id) as request_count,
               COUNT(lr.request_id) as lesson_count
        FROM subject s
        LEFT JOIN lesson_request lr ON s.subject_id = lr.subject_id
        GROUP BY s.subject_id, s.name
        ORDER BY request_count DESC
      `);
            return result.rows;
        } catch (error) {
            console.error('Error getting subject popularity:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsRepository();