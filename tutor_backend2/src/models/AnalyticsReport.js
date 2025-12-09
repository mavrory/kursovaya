class AnalyticsReport {
    constructor(data) {
        this.report_id = data.report_id;
        this.generated_by = data.generated_by;
        this.date_generated = data.date_generated;
        this.avg_rating = data.avg_rating;
        this.avg_satisfaction = data.avg_satisfaction;
        this.top_tutor_id = data.top_tutor_id;
        // Дополнительные поля
        this.generated_by_name = data.generated_by_name;
        this.top_tutor_name = data.top_tutor_name;
    }

    toJSON() {
        return {
            report_id: this.report_id,
            generated_by: this.generated_by,
            date_generated: this.date_generated,
            avg_rating: this.avg_rating,
            avg_satisfaction: this.avg_satisfaction,
            top_tutor_id: this.top_tutor_id,
            generated_by_name: this.generated_by_name,
            top_tutor_name: this.top_tutor_name
        };
    }
}

module.exports = AnalyticsReport;