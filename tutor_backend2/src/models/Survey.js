class Survey {
    constructor(data) {
        this.survey_id = data.survey_id;
        this.user_id = data.user_id;
        this.target_user_id = data.target_user_id;
        this.lesson_id = data.lesson_id;
        this.satisfaction_level = data.satisfaction_level;
        this.knowledge_growth = data.knowledge_growth;
        this.comment = data.comment;
        this.survey_date = data.survey_date;
        // Дополнительные поля
        this.user_name = data.user_name;
        this.target_user_name = data.target_user_name;
        this.tutor_id = data.tutor_id;
        this.tutor_name = data.tutor_name;
        this.subject_name = data.subject_name;
    }

    toJSON() {
        return {
            survey_id: this.survey_id,
            user_id: this.user_id,
            target_user_id: this.target_user_id,
            lesson_id: this.lesson_id,
            satisfaction_level: this.satisfaction_level,
            knowledge_growth: this.knowledge_growth,
            comment: this.comment,
            survey_date: this.survey_date,
            user_name: this.user_name,
            target_user_name: this.target_user_name,
            tutor_id: this.tutor_id,
            tutor_name: this.tutor_name,
            subject_name: this.subject_name
        };
    }
}

module.exports = Survey;