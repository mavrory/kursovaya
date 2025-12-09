const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Избегаем циклической зависимости через services/index
const userService = require('./user.service');
const roleService = require('./role.service');

class AuthService {
    async register(userData) {
        let { name, email, password, role_name } = userData;

        // Роль по умолчанию — студент, если не передана
        if (!role_name) {
            role_name = 'student';
        }

        // Проверка валидности данных (роль не обязательна во входных данных)
        if (!name || !email || !password) {
            throw new Error('All fields are required');
        }

        // Проверка email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Проверка существования email через UserService
        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Определяем role_id через RoleService
        const role = await roleService.getRoleByName(role_name);
        if (!role) {
            throw new Error('Invalid role');
        }

        // Проверка валидности роли
        const validRoles = ['student', 'tutor', 'admin'];
        if (!validRoles.includes(role_name.toLowerCase())) {
            throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
        }

        // Хэширование пароля
        const password_hash = await bcrypt.hash(password, 10);

        // Создаем пользователя
        const user = await userService.createUser({
            name,
            email,
            password_hash,
            role_id: role.role_id
        });

        // Получаем полные данные пользователя
        const fullUser = await userService.getUserById(user.user_id);

        // Генерируем токен
        const token = this.generateToken(fullUser);

        return {
            user: {
                user_id: fullUser.user_id,
                name: fullUser.name,
                email: fullUser.email,
                role_id: fullUser.role_id,
                role_name: role_name // Возвращаем role_name как строку
            },
            token
        };
    }

    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Находим пользователя (нужен метод в UserService)
        const user = await userService.getUserByEmail(email);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Проверяем пароль
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.is_blocked) {
            throw new Error('Your account has been blocked. Please contact administrator.');
        }

        // Получаем роль
        const role = await roleService.getRoleById(user.role_id);

        if (!role) {
            throw new Error('User role not found');
        }

        // Генерируем токен
        const token = this.generateToken(user);

        return {
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role_id: user.role_id,
                role_name: role.role_name // Возвращаем role_name как строку
            },
            token
        };
    }

    generateToken(user) {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role_id: user.role_id
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = new AuthService();