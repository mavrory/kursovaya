class Review {
    constructor(data) {
        this.review_id = data.review_id;
        this.student_id = data.student_id;
        this.tutor_id = data.tutor_id;
        this.lesson_id = data.lesson_id;
        this.rating = data.rating;
        this.comment = data.comment;
        this.date_posted = data.date_posted;
        // Дополнительные поля
        this.student_name = data.student_name;
        this.tutor_name = data.tutor_name;
        this.subject_name = data.subject_name;
    }

    toJSON() {
        return {
            review_id: this.review_id,
            student_id: this.student_id,
            tutor_id: this.tutor_id,
            lesson_id: this.lesson_id,
            rating: this.rating,
            comment: this.comment,
            date_posted: this.date_posted,
            student_name: this.student_name,
            tutor_name: this.tutor_name,
            subject_name: this.subject_name
        };
    }
}

module.exports = Review;