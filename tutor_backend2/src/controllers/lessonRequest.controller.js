const { lessonRequestService } = require('../services');

class LessonRequestController {
    async createLessonRequest(req, res) {
        try {
            const requestData = {
                student_id: req.user.user_id,
                ...req.body
            };

            const lessonRequest = await lessonRequestService.createLessonRequest(requestData);

            res.status(201).json({
                success: true,
                message: 'Lesson request created successfully',
                data: lessonRequest
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getLessonRequestById(req, res) {
        try {
            const lessonRequest = await lessonRequestService.getLessonRequestById(
                req.params.id,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                data: lessonRequest
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async getMyLessonRequests(req, res) {
        try {
            const requests = await lessonRequestService.getLessonRequestsByUser(
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                data: requests
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateLessonRequestStatus(req, res) {
        try {
            const { status } = req.body;
            const updatedRequest = await lessonRequestService.updateLessonRequestStatus(
                req.params.id,
                status,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                message: 'Lesson request status updated',
                data: updatedRequest
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async cancelLessonRequest(req, res) {
        try {
            const cancelledRequest = await lessonRequestService.cancelLessonRequest(
                req.params.id,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                message: 'Lesson request cancelled',
                data: cancelledRequest
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRequestStatistics(req, res) {
        try {
            const statistics = await lessonRequestService.getRequestStatistics(
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async rescheduleLessonRequest(req, res) {
        try {
            const { new_time } = req.body;
            const rescheduledRequest = await lessonRequestService.rescheduleLessonRequest(
                req.params.id,
                new_time,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                message: 'Lesson request rescheduled',
                data: rescheduledRequest
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new LessonRequestController();