const express = require('express');
const { notificationController } = require('../controllers');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Получение всех уведомлений пользователя
router.get('/', notificationController.getNotifications);

// Отметить уведомление как прочитанное
router.put('/:id/read', notificationController.markAsRead);

// Отметить все уведомления как прочитанные
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;

