const { roleRepository, userRepository } = require('../repositories');

class RoleService {
    async getAllRoles() {
        try {
            return await roleRepository.findAll();
        } catch (error) {
            throw new Error(`Failed to get roles: ${error.message}`);
        }
    }

    async getRoleById(role_id) {
        try {
            const role = await roleRepository.findById(role_id);
            if (!role) {
                throw new Error('Role not found');
            }
            return role;
        } catch (error) {
            throw new Error(`Failed to get role: ${error.message}`);
        }
    }

    async getRoleByName(role_name) {
        try {
            const role = await roleRepository.findByName(role_name);
            if (!role) {
                throw new Error('Role not found');
            }
            return role;
        } catch (error) {
            throw new Error(`Failed to get role by name: ${error.message}`);
        }
    }

    async createRole(roleData) {
        try {
            const { role_name, description } = roleData;

            // Проверяем, существует ли уже роль с таким названием
            const existingRole = await roleRepository.findByName(role_name);
            if (existingRole) {
                throw new Error('Role with this name already exists');
            }

            // Здесь нужен метод create в RoleRepository
            // Пока возвращаем данные новой роли
            return {
                role_name,
                description,
                role_id: Date.now() // временный ID
            };
        } catch (error) {
            throw new Error(`Failed to create role: ${error.message}`);
        }
    }

    async updateRole(role_id, updateData) {
        try {
            const role = await roleRepository.findById(role_id);
            if (!role) {
                throw new Error('Role not found');
            }

            // Проверяем уникальность названия, если оно меняется
            if (updateData.role_name && updateData.role_name !== role.role_name) {
                const existingRole = await roleRepository.findByName(updateData.role_name);
                if (existingRole) {
                    throw new Error('Role with this name already exists');
                }
            }

            // Здесь нужен метод update в RoleRepository
            // Пока возвращаем обновленные данные
            return {
                ...role.toJSON(),
                ...updateData
            };
        } catch (error) {
            throw new Error(`Failed to update role: ${error.message}`);
        }
    }

    async deleteRole(role_id) {
        try {
            const role = await roleRepository.findById(role_id);
            if (!role) {
                throw new Error('Role not found');
            }

            // Проверяем, используются ли эта роль пользователями
            const usersWithRole = await userRepository.getAll(role_id);
            if (usersWithRole.length > 0) {
                throw new Error(`Cannot delete role that is used by ${usersWithRole.length} users`);
            }

            // Проверяем, не является ли это стандартной ролью
            const standardRoles = ['student', 'tutor', 'admin'];
            if (standardRoles.includes(role.role_name)) {
                throw new Error('Cannot delete standard roles');
            }

            // Здесь нужен метод delete в RoleRepository
            // Пока возвращаем роль
            return role;
        } catch (error) {
            throw new Error(`Failed to delete role: ${error.message}`);
        }
    }

    async getRoleStatistics(role_id) {
        try {
            const role = await roleRepository.findById(role_id);
            if (!role) {
                throw new Error('Role not found');
            }

            // Получаем пользователей с этой ролью
            const users = await userRepository.getAll(role_id);

            // Собираем статистику
            const userCount = users.length;
            const activeUsers = users.length; // Здесь можно добавить логику активности

            // Для роли репетитора собираем дополнительную статистику
            let additionalStats = {};
            if (role.role_name === 'tutor') {
                // Можно добавить статистику по урокам, отзывам и т.д.
            } else if (role.role_name === 'student') {
                // Статистика по студентам
            }

            return {
                role: role.toJSON(),
                statistics: {
                    total_users: userCount,
                    active_users: activeUsers,
                    ...additionalStats
                },
                recent_users: users.slice(0, 5).map(user => user.toSafeJSON())
            };
        } catch (error) {
            throw new Error(`Failed to get role statistics: ${error.message}`);
        }
    }

    async validateRoleChange(user_id, new_role_id) {
        try {
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }

            const newRole = await roleRepository.findById(new_role_id);
            if (!newRole) {
                throw new Error('New role not found');
            }

            // Проверяем, можно ли сменить роль
            const currentRole = await roleRepository.findById(user.role_id);

            // Логика валидации смены роли
            const restrictions = {
                'student': ['tutor'], // студент может стать репетитором
                'tutor': ['student'], // репетитор может стать студентом
                'admin': ['student', 'tutor'] // админ может стать кем угодно
            };

            if (restrictions[currentRole.role_name] &&
                !restrictions[currentRole.role_name].includes(newRole.role_name)) {
                throw new Error(`Cannot change role from ${currentRole.role_name} to ${newRole.role_name}`);
            }

            return {
                valid: true,
                current_role: currentRole.role_name,
                new_role: newRole.role_name,
                message: 'Role change is valid'
            };
        } catch (error) {
            throw new Error(`Failed to validate role change: ${error.message}`);
        }
    }
}

module.exports = new RoleService();