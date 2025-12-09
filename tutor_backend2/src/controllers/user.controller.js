const { userService } = require('../services');

class UserController {
    async getProfile(req, res) {
        try {
            const user = await userService.getUserById(req.user.user_id);

            res.json({
                success: true,
                data: user.toSafeJSON()
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const updatedUser = await userService.updateUser(req.user.user_id, req.body);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser.toSafeJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getAllUsers(req, res) {
        try {
            const { role_id } = req.query;
            // Исключаем текущего пользователя (админа) из списка
            const users = await userService.getAllUsers(role_id, req.user.user_id);

            res.json({
                success: true,
                data: users.map(user => user.toSafeJSON())
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async blockUser(req, res) {
        try {
            const user_id = req.params.id;
            const { is_blocked } = req.body;

            // Нельзя заблокировать самого себя
            if (parseInt(user_id) === req.user.user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot block yourself'
                });
            }

            const updatedUser = await userService.blockUser(user_id, is_blocked);

            res.json({
                success: true,
                message: is_blocked ? 'User blocked successfully' : 'User unblocked successfully',
                data: updatedUser.toSafeJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getUserById(req, res) {
        try {
            const user = await userService.getUserById(req.params.id);

            res.json({
                success: true,
                data: user.toSafeJSON()
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async changeUserRole(req, res) {
        try {
            const { role_name } = req.body;
            const updatedUser = await userService.changeUserRole(req.params.id, role_name);

            res.json({
                success: true,
                message: 'User role changed successfully',
                data: updatedUser.toSafeJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getUsersByRole(req, res) {
        try {
            const users = await userService.getUsersByRole(req.params.role_name);

            res.json({
                success: true,
                data: users.map(user => user.toSafeJSON())
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new UserController();