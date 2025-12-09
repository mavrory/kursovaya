const { reviewService } = require('../services');

class ReviewController {
    async createReview(req, res) {
        try {
            const reviewData = {
                student_id: req.user.user_id,
                ...req.body
            };

            const review = await reviewService.createReview(reviewData);

            res.status(201).json({
                success: true,
                message: 'Review created successfully',
                data: review
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorReviews(req, res) {
        try {
            const tutor_id = req.params.id;
            const reviews = await reviewService.getTutorReviews(tutor_id);

            res.json({
                success: true,
                data: reviews
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async getMyReviews(req, res) {
        try {
            let reviews;
            if (req.user.role_name === 'student') {
                reviews = await reviewService.getStudentReviews(req.user.user_id);
            } else if (req.user.role_name === 'tutor') {
                // Для репетитора возвращаем отзывы о нем
                const tutorReviews = await reviewService.getTutorReviews(req.user.user_id);
                reviews = tutorReviews.reviews || [];
            } else {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid role for this operation'
                });
            }

            // Возвращаем массив напрямую, как ожидает фронтенд
            res.json(reviews);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateReview(req, res) {
        try {
            const updatedReview = await reviewService.updateReview(
                req.params.id,
                req.body,
                req.user.user_id
            );

            res.json({
                success: true,
                message: 'Review updated successfully',
                data: updatedReview
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async deleteReview(req, res) {
        try {
            const deletedReview = await reviewService.deleteReview(
                req.params.id,
                req.user.user_id
            );

            res.json({
                success: true,
                message: 'Review deleted successfully',
                data: deletedReview
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getCompletedLessonsWithoutReview(req, res) {
        try {
            if (req.user.role_name !== 'student') {
                return res.status(403).json({
                    success: false,
                    error: 'Only students can access this endpoint'
                });
            }

            const lessons = await reviewService.getCompletedLessonsWithoutReview(req.user.user_id);
            res.json(lessons);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ReviewController();