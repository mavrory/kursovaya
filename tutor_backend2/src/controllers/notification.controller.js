const { notificationService } = require('../services');

class NotificationController {
    async getNotifications(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user.user_id);

            res.json(notifications);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async markAsRead(req, res) {
        try {
            await notificationService.markAsRead(req.params.id, req.user.user_id);

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async markAllAsRead(req, res) {
        try {
            await notificationService.markAllAsRead(req.user.user_id);

            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorNotifications(req, res) {
        try {
            if (req.user.role_name !== 'tutor') {
                return res.status(403).json({
                    success: false,
                    error: 'Only tutors can access this endpoint'
                });
            }

            const notifications = await notificationService.getTutorNotifications(req.user.user_id);
            res.json(notifications);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController();

