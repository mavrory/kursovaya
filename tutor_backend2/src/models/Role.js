class Role {
    constructor(data) {
        this.role_id = data.role_id;
        this.role_name = data.role_name;
        this.description = data.description;
    }

    toJSON() {
        return {
            role_id: this.role_id,
            role_name: this.role_name,
            description: this.description
        };
    }
}

module.exports = Role;