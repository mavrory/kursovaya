const { dashboardService } = require('../services');

class DashboardController {
    async getStudentStats(req, res) {
        try {
            const stats = await dashboardService.getStudentStats(req.user.user_id);

            res.json(stats);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorStats(req, res) {
        try {
            const stats = await dashboardService.getTutorStats(req.user.user_id);

            // Возвращаем статистику напрямую, как ожидает фронтенд
            res.json(stats);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new DashboardController();

