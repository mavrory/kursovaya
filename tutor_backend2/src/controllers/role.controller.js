const { roleService } = require('../services');

class RoleController {
    async getAllRoles(req, res) {
        try {
            const roles = await roleService.getAllRoles();

            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRoleById(req, res) {
        try {
            const role = await roleService.getRoleById(req.params.id);

            res.json({
                success: true,
                data: role
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async deleteRole(req, res) {

    }

    async createRole(req, res) {
        try {
            // Только админ может создавать роли
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can create roles'
                });
            }

            const role = await roleService.createRole(req.body);

            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: role
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateRole(req, res) {
        try {
            // Только админ может обновлять роли
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can update roles'
                });
            }

            const updatedRole = await roleService.updateRole(req.params.id, req.body);

            res.json({
                success: true,
                message: 'Role updated successfully',
                data: updatedRole
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRoleStatistics(req, res) {
        try {
            // Только админ может видеть статистику по ролям
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can view role statistics'
                });
            }

            const statistics = await roleService.getRoleStatistics(req.params.id);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async validateRoleChange(req, res) {
        try {
            const { user_id, new_role_id } = req.body;
            const validation = await roleService.validateRoleChange(user_id, new_role_id);

            res.json({
                success: true,
                data: validation
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new RoleController();