const { authService } = require('../services');

class AuthController {
    async register(req, res) {
        try {
            const result = await authService.register(req.body);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token: result.token,
                user: result.user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
                error: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            res.json({
                success: true,
                message: 'Login successful',
                token: result.token,
                user: result.user
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message,
                error: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            res.json({
                success: true,
                data: req.user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async logout(req, res) {
        try {
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new AuthController();