const express = require('express');
const { userController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(auth);

// Получение профиля текущего пользователя
router.get('/me', userController.getProfile);

// Обновление профиля
router.put('/profile', userController.updateProfile);

// Получение пользователей по роли
router.get('/role/:role_name', userController.getUsersByRole);

// --- Административные маршруты (только для админов) ---
router.get('/', requireRole('admin'), userController.getAllUsers);
router.get('/:id', requireRole('admin'), userController.getUserById);
router.put('/:id/role', requireRole('admin'), userController.changeUserRole);
router.put('/:id/block', requireRole('admin'), userController.blockUser);

module.exports = router;