const express = require('express');
const { lessonRequestController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Создание запроса на урок
router.post('/',
    requireRole('student'),
    lessonRequestController.createLessonRequest
);

// Получение конкретного запроса
router.get('/:id', lessonRequestController.getLessonRequestById);

// Получение моих запросов
router.get('/', lessonRequestController.getMyLessonRequests);

// Обновление статуса запроса
router.put('/:id/status', lessonRequestController.updateLessonRequestStatus);

// Отмена запроса
router.delete('/:id/cancel', lessonRequestController.cancelLessonRequest);

// Получение статистики по запросам
router.get('/statistics/my', lessonRequestController.getRequestStatistics);

// Перенос запроса
router.put('/:id/reschedule', lessonRequestController.rescheduleLessonRequest);

module.exports = router;