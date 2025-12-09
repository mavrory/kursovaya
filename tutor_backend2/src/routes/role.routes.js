const express = require('express');
const { roleController } = require('../controllers');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Публичные маршруты (не требуют аутентификации)
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);

// --- Защищенные маршруты (только для админов) ---
router.use(auth);
router.use(requireRole('admin'));

// Создание роли
router.post('/', roleController.createRole);

// Обновление роли
router.put('/:id', roleController.updateRole);

// Удаление роли
router.delete('/:id', roleController.deleteRole);

// Получение статистики по роли
router.get('/:id/statistics', roleController.getRoleStatistics);

// Валидация смены роли
router.post('/validate-change', roleController.validateRoleChange);

module.exports = router;