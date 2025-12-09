const { surveyRepository, userRepository, lessonRepository } = require('../repositories');

class SurveyService {
    async createSurvey(surveyData) {
        try {
            const { user_id, lesson_id, satisfaction_level, knowledge_growth, comment } = surveyData;

            // Проверяем существование пользователя
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }

            // Получаем урок
            const lesson = await lessonRepository.findById(lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Проверяем, что урок завершен
            if (!lesson.is_completed) {
                throw new Error('Can only survey completed lessons');
            }

            // Определяем target_user_id (для студента это репетитор, для репетитора это студент)
            let target_user_id;
            if (user_id === lesson.student_id) {
                target_user_id = lesson.tutor_id;
            } else if (user_id === lesson.tutor_id) {
                target_user_id = lesson.student_id;
            } else {
                throw new Error('User is not part of this lesson');
            }

            // Проверяем, не оставлял ли уже пользователь опрос для этого урока
            const existingSurvey = await this.checkExistingSurveyForLesson(user_id, lesson_id);
            if (existingSurvey) {
                throw new Error('You have already surveyed this lesson');
            }

            // Создаем опрос
            return await surveyRepository.create({
                user_id,
                target_user_id,
                lesson_id,
                satisfaction_level,
                knowledge_growth,
                comment
            });
        } catch (error) {
            throw new Error(`Failed to create survey: ${error.message}`);
        }
    }

    async checkIfLessonCompleted(user_id, target_user_id) {
        try {
            // Проверяем, был ли завершенный урок между пользователями
            // user_id мог быть студентом, target_user_id - репетитором или наоборот
            const userLessonsAsStudent = await lessonRepository.findByStudent(user_id);
            const userLessonsAsTutor = await lessonRepository.findByTutor(user_id);

            // Проверяем как студент -> репетитор
            const asStudent = userLessonsAsStudent.some(lesson =>
                lesson.tutor_id === target_user_id && lesson.is_completed
            );

            // Проверяем как репетитор -> студент
            const asTutor = userLessonsAsTutor.some(lesson =>
                lesson.student_id === target_user_id && lesson.is_completed
            );

            return asStudent || asTutor;
        } catch (error) {
            console.error('Error checking lesson completion:', error);
            return false;
        }
    }

    async checkExistingSurvey(user_id, target_user_id) {
        try {
            const surveys = await surveyRepository.findByTargetUser(target_user_id);
            return surveys.find(survey => survey.user_id === user_id);
        } catch (error) {
            return null;
        }
    }

    async checkExistingSurveyForLesson(user_id, lesson_id) {
        try {
            const survey = await surveyRepository.findByLesson(user_id, lesson_id);
            return survey;
        } catch (error) {
            return null;
        }
    }

    async getMySurveys(user_id) {
        try {
            const surveys = await surveyRepository.findByUser(user_id);
            return surveys.map(survey => ({
                survey_id: survey.survey_id,
                lesson_id: survey.lesson_id,
                tutor_id: survey.tutor_id,
                tutor_name: survey.tutor_name,
                subject_name: survey.subject_name,
                satisfaction_level: survey.satisfaction_level,
                knowledge_growth: survey.knowledge_growth,
                comments: survey.comment,
                submitted_at: survey.survey_date ? new Date(survey.survey_date).toISOString() : null
            }));
        } catch (error) {
            throw new Error(`Failed to get my surveys: ${error.message}`);
        }
    }

    async getAvailableLessonForSurvey(user_id) {
        try {
            const { surveyRepository } = require('../repositories');
            
            // Получаем завершенные уроки пользователя (как студента и как репетитора)
            const lessonsAsStudent = await lessonRepository.findByStudent(user_id);
            const lessonsAsTutor = await lessonRepository.findByTutor(user_id);
            const allLessons = [...lessonsAsStudent, ...lessonsAsTutor];
            const completedLessons = allLessons.filter(l => l.is_completed);

            // Находим урок, для которого еще не был создан опрос
            for (const lesson of completedLessons) {
                const existingSurvey = await surveyRepository.findByLesson(user_id, lesson.lesson_id);
                if (!existingSurvey) {
                    // Получаем детали урока
                    const lessonDetails = await lessonRepository.getLessonWithDetails(lesson.lesson_id);
                    // Определяем имя репетитора (если пользователь - студент, то tutor_name, если репетитор - то student_name)
                    let targetName = lessonDetails.tutor_name;
                    if (lessonDetails.tutor_id === user_id) {
                        targetName = lessonDetails.student_name;
                    }
                    return {
                        lesson_id: lessonDetails.lesson_id,
                        tutor_name: targetName,
                        subject_name: lessonDetails.subject_name,
                        completed_at: lessonDetails.is_completed ? new Date().toISOString() : null
                    };
                }
            }

            return null;
        } catch (error) {
            throw new Error(`Failed to get available lesson for survey: ${error.message}`);
        }
    }

    async getUserSurveys(target_user_id) {
        try {
            const user = await userRepository.findById(target_user_id);
            if (!user) {
                throw new Error('User not found');
            }

            const surveys = await surveyRepository.findByTargetUser(target_user_id);
            const satisfactionStats = await surveyRepository.getAverageSatisfaction(target_user_id);

            return {
                user: user.toSafeJSON(),
                surveys,
                statistics: satisfactionStats
            };
        } catch (error) {
            throw new Error(`Failed to get user surveys: ${error.message}`);
        }
    }

    async getRecentSurveys(limit = 10) {
        try {
            return await surveyRepository.getRecentSurveys(limit);
        } catch (error) {
            throw new Error(`Failed to get recent surveys: ${error.message}`);
        }
    }

    async getPlatformSatisfactionStats() {
        try {
            const recentSurveys = await surveyRepository.getRecentSurveys(100);

            if (recentSurveys.length === 0) {
                return {
                    avg_satisfaction: 0,
                    avg_knowledge_growth: 0,
                    total_surveys: 0
                };
            }

            const totalSatisfaction = recentSurveys.reduce((sum, survey) =>
                sum + survey.satisfaction_level, 0
            );
            const totalKnowledgeGrowth = recentSurveys.reduce((sum, survey) =>
                sum + survey.knowledge_growth, 0
            );

            return {
                avg_satisfaction: (totalSatisfaction / recentSurveys.length).toFixed(2),
                avg_knowledge_growth: (totalKnowledgeGrowth / recentSurveys.length).toFixed(2),
                total_surveys: recentSurveys.length
            };
        } catch (error) {
            throw new Error(`Failed to get platform satisfaction stats: ${error.message}`);
        }
    }

    async updateSurvey(survey_id, updateData, user_id) {
        try {
            // Находим опрос
            const surveys = await surveyRepository.findByTargetUser(user_id); // упрощенный поиск
            const survey = surveys.find(s => s.survey_id === survey_id);

            if (!survey) {
                throw new Error('Survey not found');
            }

            // Проверяем, что пользователь - автор опроса
            if (survey.user_id !== user_id) {
                throw new Error('Not authorized to update this survey');
            }

            // Здесь нужен метод update в SurveyRepository
            // Пока возвращаем текущий опрос
            return survey;
        } catch (error) {
            throw new Error(`Failed to update survey: ${error.message}`);
        }
    }
}

module.exports = new SurveyService();