const jwt = require('jsonwebtoken');
const { userRepository } = require('../repositories');

const auth = async (req, res, next) => {
    try {
        // Получаем токен из заголовка
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Верифицируем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Находим пользователя в базе
        const user = await userRepository.findById(decoded.user_id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.is_blocked) {
            return res.status(403).json({
                success: false,
                error: 'Your account has been blocked. Please contact administrator.'
            });
        }

        // Получаем название роли
        const role = await userRepository.getUserRole(user.user_id);

        // Добавляем пользователя в запрос
        req.user = {
            ...user.toSafeJSON(),
            role_name: role.role_name
        };
        req.token = token;

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
};

// Middleware для проверки ролей
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = { auth, requireRole };