const express = require('express');
const { reviewController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Публичные маршруты (не требуют аутентификации)
router.get('/tutor/:id', reviewController.getTutorReviews);

// --- Защищенные маршруты (требуют аутентификации) ---
router.use(auth);

// Создание отзыва
router.post('/',
    requireRole('student'),
    reviewController.createReview
);

// Получение моих отзывов
router.get('/my', reviewController.getMyReviews);

// Получение завершенных уроков без отзыва
router.get('/completed-lessons-without-review', reviewController.getCompletedLessonsWithoutReview);

// Обновление отзыва
router.put('/:id',
    requireRole('student'),
    reviewController.updateReview
);

// Удаление отзыва
router.delete('/:id',
    requireRole('student', 'admin'),
    reviewController.deleteReview
);

module.exports = router;