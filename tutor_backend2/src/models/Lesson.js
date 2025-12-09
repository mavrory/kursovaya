class Lesson {
    constructor(data) {
        this.lesson_id = data.lesson_id;
        this.request_id = data.request_id;
        this.tutor_id = data.tutor_id;
        this.student_id = data.student_id;
        this.lesson_date = data.lesson_date;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.is_completed = data.is_completed;
        // Дополнительные поля
        this.tutor_name = data.tutor_name;
        this.student_name = data.student_name;
        this.subject_name = data.subject_name;
    }

    toJSON() {
        return {
            lesson_id: this.lesson_id,
            request_id: this.request_id,
            tutor_id: this.tutor_id,
            student_id: this.student_id,
            lesson_date: this.lesson_date,
            start_time: this.start_time,
            end_time: this.end_time,
            is_completed: this.is_completed,
            tutor_name: this.tutor_name,
            student_name: this.student_name,
            subject_name: this.subject_name
        };
    }
}

module.exports = Lesson;