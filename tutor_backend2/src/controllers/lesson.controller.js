const { lessonService } = require('../services');

class LessonController {
    async requestLesson(req, res) {
        try {
            const requestData = {
                student_id: req.user.user_id,
                ...req.body
            };

            const lessonRequest = await lessonService.requestLesson(requestData);

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

    async getLessonRequests(req, res) {
        try {
            const requests = await lessonService.getLessonRequests(req.user.user_id, req.user.role_name);

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

    async processLessonRequest(req, res) {
        try {
            const { action } = req.body;
            const result = await lessonService.processLessonRequest(
                req.params.id,
                action,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                message: `Lesson request ${action}ed successfully`,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getLessons(req, res) {
        try {
            const lessons = await lessonService.getLessons(req.user.user_id, req.user.role_name);
            res.json(lessons);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getUpcomingLessons(req, res) {
        try {
            const lessons = await lessonService.getUpcomingLessons(req.user.user_id, req.user.role_name);
            res.json(lessons);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorUpcomingLessons(req, res) {
        try {
            if (req.user.role_name !== 'tutor') {
                return res.status(403).json({
                    success: false,
                    error: 'Only tutors can access this endpoint'
                });
            }

            const lessons = await lessonService.getUpcomingLessons(req.user.user_id, 'tutor');
            res.json(lessons);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getStudentUpcomingLessons(req, res) {
        try {
            const lessons = await lessonService.getUpcomingLessons(req.user.user_id, 'student');
            res.json(lessons);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async handleLessonAction(req, res) {
        try {
            const { id } = req.params;
            const { action, ...actionData } = req.body;
            
            if (!action) {
                return res.status(400).json({
                    success: false,
                    error: 'Action is required'
                });
            }

            const result = await lessonService.handleLessonAction(
                id,
                action,
                req.user.user_id,
                req.user.role_name,
                actionData
            );

            res.json({
                success: true,
                message: `Lesson ${action}ed successfully`,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async rateLesson(req, res) {
        try {
            const { id } = req.params;
            const { rating, review } = req.body;

            if (!rating) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating is required'
                });
            }

            const result = await lessonService.rateLesson(
                id,
                req.user.user_id,
                req.user.role_name,
                { rating, review }
            );

            res.json({
                success: true,
                message: 'Lesson rated successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async completeLesson(req, res) {
        try {
            const completedLesson = await lessonService.completeLesson(
                req.params.id,
                req.user.user_id,
                req.user.role_name
            );

            res.json({
                success: true,
                message: 'Lesson marked as completed',
                data: completedLesson
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getAvailableLessonForSurvey(req, res) {
        try {
            const lesson = await lessonService.getAvailableLessonForSurvey(req.user.user_id);
            res.json(lesson || {});
        } catch (error) {
            res.status(500).json({
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

            const lessons = await lessonService.getCompletedLessonsWithoutReview(req.user.user_id);
            res.json(lessons);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async autoCompleteLessons(req, res) {
        try {
            // Только админ может запускать автоматическое завершение вручную
            // В продакшене это должно быть cron job
            if (req.user && req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can trigger auto-completion'
                });
            }

            const result = await lessonService.autoCompleteLessons();
            res.json({
                success: true,
                message: `Auto-completed ${result.completed} out of ${result.total} lessons`,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorPendingRequests(req, res) {
        try {
            if (req.user.role_name !== 'tutor') {
                return res.status(403).json({
                    success: false,
                    error: 'Only tutors can access this endpoint'
                });
            }

            const { lessonRequestRepository } = require('../repositories');
            const requests = await lessonRequestRepository.findByTutor(req.user.user_id);
            const pendingRequests = requests.filter(req => {
                const requestData = req.toJSON ? req.toJSON() : req;
                return requestData.status === 'pending';
            });

            // Преобразуем pending requests в формат урока для форматирования
            const pendingLessons = pendingRequests.map(request => {
                const requestData = request.toJSON ? request.toJSON() : request;
                const scheduledTime = new Date(requestData.scheduled_time);
                const lesson_date = scheduledTime.toISOString().split('T')[0];
                const startTime = new Date(scheduledTime);
                const endTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
                const start_time = startTime.toTimeString().split(' ')[0];
                const end_time = endTime.toTimeString().split(' ')[0];
                
                return {
                    lesson_id: null,
                    request_id: requestData.request_id,
                    tutor_id: requestData.tutor_id,
                    student_id: requestData.student_id,
                    lesson_date,
                    start_time,
                    end_time,
                    is_completed: false,
                    request_status: 'pending',
                    subject_id: requestData.subject_id,
                    subject_name: requestData.subject_name,
                    tutor_user_id: requestData.tutor_id,
                    tutor_name: requestData.tutor_name,
                    tutor_email: requestData.tutor_email,
                    student_user_id: requestData.student_id,
                    student_name: requestData.student_name,
                    student_email: requestData.student_email,
                    price_per_hour: requestData.price_per_hour,
                    tutor_rating: requestData.tutor_rating
                };
            });

            // Форматируем для фронтенда
            const formattedRequests = await Promise.all(
                pendingLessons.map(lesson => lessonService.formatLessonForFrontend(lesson, 'tutor'))
            );
            res.json(formattedRequests);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }


    async getUpcomingWithPendingRequests(req, res) {
        try {
            const { user_id, role_name } = req.user;

            const lessons = await lessonRepository.getUpcomingWithPendingRequests(
                user_id,
                role_name
            );

            // Форматируем ответ для фронтенда
            const formattedLessons = lessons.map(lesson => ({
                lesson_id: lesson.lesson_id,
                subject_name: lesson.subject_name || lesson.subject,
                student_id: lesson.student_id,
                student_name: lesson.student_name,
                tutor_id: lesson.tutor_id,
                tutor_name: lesson.tutor_name,
                lesson_date: lesson.lesson_date,
                start_time: lesson.start_time,
                end_time: lesson.end_time,
                duration: lesson.duration || 60,
                price: lesson.price_per_hour || 0,
                status: lesson.request_status || 'scheduled',
                description: lesson.description,
                meeting_link: lesson.meeting_link,
                // Данные о pending запросе на перенос
                pending_change_request: lesson.change_status === 'pending' ? {
                    change_id: lesson.change_id,
                    proposed_date: lesson.proposed_date,
                    proposed_time: lesson.proposed_time,
                    comment: lesson.change_comment,
                    status: lesson.change_status,
                    requester_id: lesson.requester_id,
                    is_responder: lesson.responder_id === user_id // Является ли текущий пользователь ответчиком
                } : null
            }));

            res.json(formattedLessons);
        } catch (error) {
            console.error('Error getting lessons with pending requests:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new LessonController();