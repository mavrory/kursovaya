const { userRepository, roleRepository } = require('../repositories');

class UserService {
    async getAllUsers(role_id = null, exclude_user_id = null) {
        try {
            return await userRepository.getAll(role_id, exclude_user_id);
        } catch (error) {
            throw new Error(`Failed to get users: ${error.message}`);
        }
    }

    async blockUser(user_id, is_blocked) {
        try {
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }

            return await userRepository.update(user_id, { is_blocked });
        } catch (error) {
            throw new Error(`Failed to block user: ${error.message}`);
        }
    }

    async getUserByEmail(email) {
        try {
            return await userRepository.findByEmail(email);
        } catch (error) {
            throw new Error(`Failed to get user by email: ${error.message}`);
        }
    }

    async createUser(userData) {
        try {
            const { name, email, password_hash, role_id } = userData;

            // Проверка уникальности email
            const existing = await userRepository.findByEmail(email);
            if (existing) {
                throw new Error('Email already exists');
            }

            return await userRepository.create({
                name,
                email,
                password_hash,
                role_id
            });
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    async getUserById(user_id) {
        try {
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    async updateUser(user_id, updateData) {
        try {
            // Проверяем существование пользователя
            const existingUser = await userRepository.findById(user_id);
            if (!existingUser) {
                throw new Error('User not found');
            }

            // Если меняется email, проверяем уникальность
            if (updateData.email && updateData.email !== existingUser.email) {
                const emailExists = await userRepository.findByEmail(updateData.email);
                if (emailExists) {
                    throw new Error('Email already in use');
                }
            }

            return await userRepository.update(user_id, updateData);
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    async deleteUser(user_id) {
        try {
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }

            // Можно добавить дополнительную логику перед удалением
            // Например, проверку на активные уроки и т.д.

            // Вместо физического удаления можно сделать мягкое удаление
            // Но для простоты будем удалять
            // return await userRepository.delete(user_id);

            // Пока что возвращаем пользователя, но не удаляем
            return user;
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }

    async getUserProfile(user_id) {
        try {
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }
            return user.toSafeJSON();
        } catch (error) {
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
    }

    async changeUserRole(user_id, new_role_name) {
        try {
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }

            const role = await roleRepository.findByName(new_role_name);
            if (!role) {
                throw new Error('Invalid role');
            }

            // Обновляем роль пользователя
            return await userRepository.update(user_id, { role_id: role.role_id });
        } catch (error) {
            throw new Error(`Failed to change user role: ${error.message}`);
        }
    }

    async getUsersByRole(role_name) {
        try {
            const role = await roleRepository.findByName(role_name);
            if (!role) {
                throw new Error('Invalid role');
            }

            return await userRepository.getAll(role.role_id);
        } catch (error) {
            throw new Error(`Failed to get users by role: ${error.message}`);
        }
    }
}

module.exports = new UserService();