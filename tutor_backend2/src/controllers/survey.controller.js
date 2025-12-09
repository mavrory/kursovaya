const { surveyService } = require('../services');

class SurveyController {
    async createSurvey(req, res) {
        try {
            // Нормализуем comments -> comment для совместимости с фронтендом
            const body = { ...req.body };
            if (body.comments !== undefined && body.comment === undefined) {
                body.comment = body.comments;
            }
            
            const surveyData = {
                user_id: req.user.user_id,
                ...body
            };

            const survey = await surveyService.createSurvey(surveyData);

            res.status(201).json({
                success: true,
                message: 'Survey submitted successfully',
                data: survey
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getUserSurveys(req, res) {
        try {
            const target_user_id = req.params.id || req.user.user_id;
            const surveys = await surveyService.getUserSurveys(target_user_id);

            res.json({
                success: true,
                data: surveys
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRecentSurveys(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const surveys = await surveyService.getRecentSurveys(limit);

            res.json({
                success: true,
                data: surveys
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPlatformSatisfactionStats(req, res) {
        try {
            // Только админ может видеть статистику по всей платформе
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can view platform statistics'
                });
            }

            const stats = await surveyService.getPlatformSatisfactionStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getMySurveys(req, res) {
        try {
            const surveys = await surveyService.getMySurveys(req.user.user_id);
            res.json(surveys);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new SurveyController();