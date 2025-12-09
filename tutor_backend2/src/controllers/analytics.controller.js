const { analyticsService } = require('../services');

class AnalyticsController {
    // Легкая аналитика просмотров каталога (без хранения в БД)
    async trackTutorView(req, res) {
        try {
            const { tutor_id, action = 'view', timestamp } = req.body || {};

            if (!tutor_id) {
                return res.status(400).json({
                    success: false,
                    error: 'tutor_id is required'
                });
            }

            console.log('📊 [Analytics] tutor-view event', {
                tutor_id,
                action,
                timestamp: timestamp || new Date().toISOString(),
                user_id: req.user?.user_id || null
            });

            res.status(201).json({
                success: true,
                message: 'Tutor view event accepted'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async generateReport(req, res) {
        try {
            // Только админ может генерировать отчеты
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can generate reports'
                });
            }

            const report = await analyticsService.generatePlatformReport(req.user.user_id);

            res.status(201).json({
                success: true,
                message: 'Analytics report generated successfully',
                data: report
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPlatformStats(req, res) {
        try {
            // Только админ может видеть статистику платформы
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can view platform statistics'
                });
            }

            const stats = await analyticsService.getPlatformStats();

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

    async getSubjectAnalytics(req, res) {
        try {
            // Только админ может видеть аналитику по предметам
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can view subject analytics'
                });
            }

            const analytics = await analyticsService.getSubjectAnalytics();

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorPerformance(req, res) {
        try {
            const tutor_id = req.params.id;

            // Проверяем права: админ или сам репетитор
            if (req.user.role_name !== 'admin' && req.user.user_id !== parseInt(tutor_id)) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view this tutor performance'
                });
            }

            const performance = await analyticsService.getTutorPerformance(tutor_id);

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRecentReports(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const reports = await analyticsService.getRecentReports(limit);

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new AnalyticsController();