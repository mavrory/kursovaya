const express = require('express');
const { tutorController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Регистрация как репетитор (требует аутентификации)
router.post('/register',
    auth,
    requireRole('student'), // только студенты могут стать репетиторами
    tutorController.registerAsTutor
);

// Публичные маршруты (не требуют аутентификации)
router.get('/', tutorController.getAllTutors);
// Публичное расписание репетитора (для студентов, чтобы выбрать время) - ДОЛЖНО БЫТЬ ДО /:id
router.get('/:id/schedule', tutorController.getPublicTutorSchedule);

// --- Защищенные маршруты (требуют аутентификации) ---
router.use(auth);

// Рекомендуемые репетиторы (должен быть ДО /:id)
router.get('/recommended', tutorController.getRecommendedTutors);

// Уведомления репетитора
const { notificationController } = require('../controllers');
router.get('/notifications', 
    requireRole('tutor'),
    notificationController.getTutorNotifications
);

// Обновление профиля репетитора
router.put('/profile',
    requireRole('tutor'),
    tutorController.updateTutorProfile
);

// Расписание репетитора
router.get('/schedule',
    requireRole('tutor'),
    tutorController.getSchedule
);

// Блокировка времени в расписании
router.post('/schedule/block',
    requireRole('tutor'),
    tutorController.blockTime
);

// Получение списка студентов репетитора
router.get('/students',
    requireRole('tutor'),
    tutorController.getStudents
);

// Обновление рейтинга репетитора
router.put('/:id/rating',
    requireRole('admin', 'tutor'),
    tutorController.updateTutorRating
);

// Получение профиля репетитора (должен быть в конце, чтобы не перехватывать другие роуты)
router.get('/:id', tutorController.getTutorProfile);

module.exports = router;