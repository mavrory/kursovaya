const express = require('express');
const { dashboardController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Статистика студента
router.get('/student/stats',
    requireRole('student'),
    dashboardController.getStudentStats
);

// Статистика репетитора
router.get('/tutor/stats',
    requireRole('tutor'),
    dashboardController.getTutorStats
);

module.exports = router;

