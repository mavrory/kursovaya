const express = require('express');
const { lessonChangeRequestController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Создание запроса на изменение урока (Фронтенд будет использовать /api/change-requests)
router.post('/', lessonChangeRequestController.requestLessonChange);

// НОВЫЙ МАРШРУТ: Обработка запроса на изменение по ID урока (используется для Accept/Reject на фронте)
// Фронтенд будет использовать /api/change-requests/lesson/:lesson_id/process
router.put('/lesson/:lesson_id/process', lessonChangeRequestController.processByLessonId);

// Получение запросов на изменение для урока
router.get('/lesson/:lesson_id', lessonChangeRequestController.getChangeRequests);

// Получение моих запросов на изменение
router.get('/my', lessonChangeRequestController.getMyChangeRequests);

// Обработка запроса на изменение по ID запроса (старый метод)
router.put('/:id/process', lessonChangeRequestController.processChangeRequest);

// Получение ожидающих запросов
router.get('/pending', lessonChangeRequestController.getPendingRequests);

// Отмена запроса на изменение
router.delete('/:id/cancel', lessonChangeRequestController.cancelChangeRequest);

module.exports = router;