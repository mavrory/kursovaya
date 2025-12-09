const express = require('express');
const { lessonController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Создание запроса на урок
router.post('/request',
    requireRole('student'),
    lessonController.requestLesson
);

// Получение запросов на уроки
router.get('/requests', lessonController.getLessonRequests);

// Обработка запроса на урок
router.put('/requests/:id/:action', lessonController.processLessonRequest);

// Получение уроков
router.get('/', lessonController.getLessons);

// Получение предстоящих уроков
router.get('/upcoming', lessonController.getUpcomingLessons);

// Получение предстоящих уроков студента
router.get('/student/upcoming',
    requireRole('student'),
    lessonController.getStudentUpcomingLessons
);

// Получение предстоящих уроков репетитора
router.get('/tutor/upcoming',
    requireRole('tutor'),
    lessonController.getTutorUpcomingLessons
);

// Получение ожидающих запросов репетитора
router.get('/tutor/pending-requests',
    requireRole('tutor'),
    lessonController.getTutorPendingRequests
);

// Получение урока доступного для опроса
router.get('/available-for-survey', lessonController.getAvailableLessonForSurvey);

// Получение завершенных уроков без отзыва
router.get('/completed-without-review', lessonController.getCompletedLessonsWithoutReview);

// Автоматическое завершение уроков (для cron job или админа)
router.post('/auto-complete',
    requireRole('admin'),
    lessonController.autoCompleteLessons
);

// Оценка урока (должен быть ДО /:id/actions, чтобы не перехватывался)
router.post('/:id/rate', lessonController.rateLesson);

// Действия с уроком (отмена, перенос, принятие, отклонение)
router.post('/:id/actions', lessonController.handleLessonAction);

// Действия с уроком через параметр URL (для совместимости с фронтендом)
router.post('/:id/:action', (req, res) => {
    // Перенаправляем на handleLessonAction с action из URL
    req.body.action = req.params.action;
    lessonController.handleLessonAction(req, res);
});

// Завершение урока
router.put('/:id/complete',
    requireRole('tutor'),
    lessonController.completeLesson
);

router.get('/tutor/with-pending-requests',
    auth,
    requireRole(['tutor']),
    lessonController.getUpcomingWithPendingRequests
);

router.get('/student/with-pending-requests',
    auth,
    requireRole(['student']),
    lessonController.getUpcomingWithPendingRequests
);

module.exports = router;