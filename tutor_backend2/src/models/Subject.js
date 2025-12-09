class Subject {
    constructor(data) {
        this.subject_id = data.subject_id;
        this.name = data.name;
        this.description = data.description;
    }

    toJSON() {
        return {
            subject_id: this.subject_id,
            name: this.name,
            description: this.description
        };
    }
}

module.exports = Subject;