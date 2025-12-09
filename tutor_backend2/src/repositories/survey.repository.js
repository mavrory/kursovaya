const database = require('../config/database');
const { Survey } = require('../models');

class SurveyRepository {
    async create(surveyData) {
        try {
            const { user_id, target_user_id, lesson_id, satisfaction_level, knowledge_growth, comment } = surveyData;
            const result = await database.query(
                `INSERT INTO survey (user_id, target_user_id, lesson_id, satisfaction_level, knowledge_growth, comment)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
                [user_id, target_user_id, lesson_id, satisfaction_level, knowledge_growth, comment]
            );
            return new Survey(result.rows[0]);
        } catch (error) {
            console.error('Error creating survey:', error);
            throw error;
        }
    }

    async findByTargetUser(target_user_id) {
        try {
            const result = await database.query(
                `SELECT s.*, 
                u.name as user_name,
                tu.name as target_user_name
         FROM survey s
         JOIN "user" u ON s.user_id = u.user_id
         JOIN "user" tu ON s.target_user_id = tu.user_id
         WHERE s.target_user_id = $1
         ORDER BY s.survey_date DESC`,
                [target_user_id]
            );
            return result.rows.map(row => new Survey(row));
        } catch (error) {
            console.error('Error finding surveys by target user:', error);
            throw error;
        }
    }

    async getAverageSatisfaction(target_user_id) {
        try {
            const result = await database.query(
                `SELECT AVG(satisfaction_level) as avg_satisfaction,
                AVG(knowledge_growth) as avg_knowledge_growth,
                COUNT(*) as total_surveys
         FROM survey 
         WHERE target_user_id = $1`,
                [target_user_id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting average satisfaction:', error);
            throw error;
        }
    }

    async getRecentSurveys(limit = 10) {
        try {
            const result = await database.query(
                `SELECT s.*, 
                u.name as user_name,
                tu.name as target_user_name
         FROM survey s
         JOIN "user" u ON s.user_id = u.user_id
         JOIN "user" tu ON s.target_user_id = tu.user_id
         ORDER BY s.survey_date DESC
         LIMIT $1`,
                [limit]
            );
            return result.rows.map(row => new Survey(row));
        } catch (error) {
            console.error('Error getting recent surveys:', error);
            throw error;
        }
    }

    async findByUser(user_id) {
        try {
            const result = await database.query(
                `SELECT s.*, 
                u.name as user_name,
                tu.name as target_user_name,
                tu.user_id as tutor_id,
                tu.name as tutor_name,
                sub.name as subject_name
         FROM survey s
         JOIN "user" u ON s.user_id = u.user_id
         JOIN "user" tu ON s.target_user_id = tu.user_id
         LEFT JOIN lesson l ON s.lesson_id = l.lesson_id
         LEFT JOIN lesson_request lr ON l.request_id = lr.request_id
         LEFT JOIN subject sub ON lr.subject_id = sub.subject_id
         WHERE s.user_id = $1
         ORDER BY s.survey_date DESC`,
                [user_id]
            );
            return result.rows.map(row => new Survey(row));
        } catch (error) {
            console.error('Error finding surveys by user:', error);
            throw error;
        }
    }

    async findByLesson(user_id, lesson_id) {
        try {
            // Ищем опрос напрямую по lesson_id и user_id
            const result = await database.query(
                `SELECT s.*
         FROM survey s
         WHERE s.user_id = $1 
           AND s.lesson_id = $2
         ORDER BY s.survey_date DESC
         LIMIT 1`,
                [user_id, lesson_id]
            );
            
            return result.rows[0] ? new Survey(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding survey by lesson:', error);
            throw error;
        }
    }
}

module.exports = new SurveyRepository();