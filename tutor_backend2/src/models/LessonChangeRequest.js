class LessonChangeRequest {
    constructor(data) {
        this.change_id = data.change_id;
        this.lesson_id = data.lesson_id;
        this.requester_id = data.requester_id;
        this.proposed_date = data.proposed_date;
        this.proposed_time = data.proposed_time;
        this.status = data.status;
        this.comment = data.comment;
        this.date_created = data.date_created;
        // Дополнительные поля
        this.requester_name = data.requester_name;
    }

    toJSON() {
        return {
            change_id: this.change_id,
            lesson_id: this.lesson_id,
            requester_id: this.requester_id,
            proposed_date: this.proposed_date,
            proposed_time: this.proposed_time,
            status: this.status,
            comment: this.comment,
            date_created: this.date_created,
            requester_name: this.requester_name
        };
    }
}

module.exports = LessonChangeRequest;