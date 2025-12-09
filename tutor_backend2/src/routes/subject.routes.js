const express = require('express');
const { subjectController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Публичные маршруты (не требуют аутентификации)
router.get('/', subjectController.getAllSubjects);
router.get('/popular', subjectController.getPopularSubjects);
router.get('/:id', subjectController.getSubjectById);
router.get('/:id/tutors', subjectController.getSubjectWithTutors);

// --- Защищенные маршруты (только для админов) ---
router.use(auth);
router.use(requireRole('admin'));

// Создание предмета
router.post('/', subjectController.createSubject);

// Обновление предмета
router.put('/:id', subjectController.updateSubject);

// Удаление предмета
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;