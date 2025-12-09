const express = require('express');
const { surveyController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Создание опроса
router.post('/', surveyController.createSurvey);

// Получение опросов пользователя
router.get('/my', surveyController.getMySurveys);
router.get('/user/:id', surveyController.getUserSurveys);
router.get('/user', surveyController.getUserSurveys);

// Получение последних опросов
router.get('/recent', surveyController.getRecentSurveys);

// --- Маршруты только для админов ---
router.get('/platform/stats',
    requireRole('admin'),
    surveyController.getPlatformSatisfactionStats
);

module.exports = router;