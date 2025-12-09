const express = require('express');
const { analyticsController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Публичный сбор простых событий просмотра репетитора
router.post('/tutor-view', analyticsController.trackTutorView);

// Все остальные маршруты только для админов
router.use(auth);
router.use(requireRole('admin'));

// Генерация отчета
router.post('/report/generate', analyticsController.generateReport);

// Получение статистики платформы
router.get('/platform/stats', analyticsController.getPlatformStats);

// Получение аналитики по предметам
router.get('/subjects', analyticsController.getSubjectAnalytics);

// Получение производительности репетитора
router.get('/tutor/:id/performance', analyticsController.getTutorPerformance);

// Получение последних отчетов
router.get('/reports/recent', analyticsController.getRecentReports);

module.exports = router;