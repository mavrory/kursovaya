const express = require('express');
const { authController } = require('../controllers');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// Регистрация
router.post('/register',
    validate.validateRegister,
    authController.register
);

// Вход
router.post('/login',
    validate.validateLogin,
    authController.login
);

// Получение профиля (требует аутентификации)
router.get('/profile',
    auth,
    authController.getProfile
);

// Выход
router.post('/logout',
    auth,
    authController.logout
);

module.exports = router;