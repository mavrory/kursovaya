class TutorSchedule {
    constructor(data) {
        this.schedule_id = data.schedule_id;
        this.tutor_id = data.tutor_id;
        this.schedule_date = data.schedule_date;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.status = data.status || 'blocked';
        this.reason = data.reason;
        this.is_recurring = data.is_recurring || false;
        this.recurring_pattern = data.recurring_pattern;
        this.date_created = data.date_created;
        this.date_updated = data.date_updated;
    }

    toJSON() {
        return {
            schedule_id: this.schedule_id,
            tutor_id: this.tutor_id,
            schedule_date: this.schedule_date,
            start_time: this.start_time,
            end_time: this.end_time,
            status: this.status,
            reason: this.reason,
            is_recurring: this.is_recurring,
            recurring_pattern: this.recurring_pattern,
            date_created: this.date_created,
            date_updated: this.date_updated
        };
    }
}

module.exports = TutorSchedule;

