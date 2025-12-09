class User {
    constructor(data) {
        this.user_id = data.user_id;
        this.name = data.name;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.role_id = data.role_id;
        this.date_registered = data.date_registered;
        this.role_name = data.role_name; // из JOIN с role
        this.is_blocked = data.is_blocked !== undefined ? Boolean(data.is_blocked) : false; // Добавляем is_blocked
    }

    toJSON() {
        return {
            user_id: this.user_id,
            name: this.name,
            email: this.email,
            role_id: this.role_id,
            role_name: this.role_name,
            date_registered: this.date_registered,
            is_blocked: this.is_blocked
        };
    }

    // Для безопасности - без пароля
    toSafeJSON() {
        return {
            user_id: this.user_id,
            name: this.name,
            email: this.email,
            role_id: this.role_id,
            role_name: this.role_name,
            date_registered: this.date_registered,
            is_blocked: this.is_blocked
        };
    }
}

module.exports = User;