class LessonRequest {
    constructor(data) {
        this.request_id = data.request_id;
        this.student_id = data.student_id;
        this.tutor_id = data.tutor_id;
        this.subject_id = data.subject_id;
        this.scheduled_time = data.scheduled_time;
        this.status = data.status;
        this.date_created = data.date_created;
        // Дополнительные поля из JOIN
        this.student_name = data.student_name;
        this.student_email = data.student_email;
        this.tutor_name = data.tutor_name;
        this.tutor_email = data.tutor_email;
        this.subject_name = data.subject_name;
        this.price_per_hour = data.price_per_hour;
        this.tutor_rating = data.tutor_rating;
    }

    toJSON() {
        return {
            request_id: this.request_id,
            student_id: this.student_id,
            tutor_id: this.tutor_id,
            subject_id: this.subject_id,
            scheduled_time: this.scheduled_time,
            status: this.status,
            date_created: this.date_created,
            student_name: this.student_name,
            tutor_name: this.tutor_name,
            subject_name: this.subject_name
        };
    }
}

module.exports = LessonRequest;