class TutorProfile {
    constructor(data) {
        this.tutor_id = data.tutor_id;
        this.subject_id = data.subject_id;
        this.experience = data.experience;
        this.price_per_hour = data.price_per_hour;
        this.rating_avg = data.rating_avg;
        // Дополнительные поля из JOIN
        this.name = data.name;
        this.email = data.email;
        this.subject_name = data.subject_name;
    }

    toJSON() {
        return {
            tutor_id: this.tutor_id,
            subject_id: this.subject_id,
            experience: this.experience,
            price_per_hour: this.price_per_hour,
            rating_avg: this.rating_avg,
            name: this.name,
            email: this.email,
            subject_name: this.subject_name
        };
    }
}

module.exports = TutorProfile;