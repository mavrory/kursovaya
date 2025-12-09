const { lessonChangeRequestService } = require('../services');

class LessonChangeRequestController {
    async requestLessonChange(req, res) {
        try {
            const changeData = {
                requester_id: req.user.user_id,
                ...req.body
            };

            const changeRequest = await lessonChangeRequestService.requestLessonChange(changeData);

            res.status(201).json({
                success: true,
                message: 'Lesson change request created successfully',
                data: changeRequest
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getChangeRequests(req, res) {
        try {
            const { lesson_id } = req.params;
            const changeRequests = await lessonChangeRequestService.getChangeRequests(
                lesson_id,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                data: changeRequests
            });
        } catch (error) {
            res.status(403).json({
                success: false,
                error: error.message
            });
        }
    }

    async getMyChangeRequests(req, res) {
        try {
            const changeRequests = await lessonChangeRequestService.getUserChangeRequests(req.user.user_id);

            res.json({
                success: true,
                data: changeRequests
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async processChangeRequest(req, res) {
        try {
            const { action, reason } = req.body;
            const result = await lessonChangeRequestService.processChangeRequest(
                req.params.id,
                action,
                req.user.user_id,
                req.user.role_name,
                reason
            );

            res.json({
                success: true,
                message: `Change request ${action}d successfully`,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPendingRequests(req, res) {
        try {
            const pendingRequests = await lessonChangeRequestService.getPendingRequests(
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                data: pendingRequests
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async cancelChangeRequest(req, res) {
        try {
            const cancelledRequest = await lessonChangeRequestService.cancelChangeRequest(
                req.params.id,
                req.user.user_id
            );

            res.json({
                success: true,
                message: 'Change request cancelled',
                data: cancelledRequest
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }


    async processByLessonId(req, res) {
        try {
            const { lesson_id } = req.params; // ID урока
            const { action } = req.body; // 'accept' или 'reject'

            if (!lesson_id || !action) {
                return res.status(400).json({ success: false, error: 'Lesson ID and action are required' });
            }

            const result = await lessonChangeRequestService.processByLessonId(
                parseInt(lesson_id, 10),
                req.user.user_id,
                action
            );

            res.json({
                success: true,
                message: `Change request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new LessonChangeRequestController();