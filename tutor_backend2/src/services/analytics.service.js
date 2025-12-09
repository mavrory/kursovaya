const {
    analyticsRepository,
    userRepository,
    lessonRepository,
    reviewRepository,
    surveyRepository
} = require('../repositories');

class AnalyticsService {
    async generatePlatformReport(generated_by) {
        try {
            // Получаем статистику платформы
            const platformStats = await analyticsRepository.getPlatformStats();

            // Получаем самого популярного репетитора
            const allTutors = await userRepository.getAll(2); // role_id = 2 для репетиторов
            let topTutor = null;
            let maxRating = 0;

            for (const tutor of allTutors) {
                const ratingStats = await reviewRepository.getTutorAverageRating(tutor.user_id);
                if (ratingStats.avg_rating && ratingStats.avg_rating > maxRating) {
                    maxRating = parseFloat(ratingStats.avg_rating);
                    topTutor = tutor;
                }
            }

            // Создаем отчет
            const report = await analyticsRepository.createReport({
                generated_by,
                avg_rating: parseFloat(platformStats.platform_avg_rating) || 0,
                avg_satisfaction: parseFloat(platformStats.platform_avg_satisfaction) || 0,
                top_tutor_id: topTutor ? topTutor.user_id : null
            });

            return {
                report,
                platform_stats: platformStats,
                top_tutor: topTutor ? topTutor.toSafeJSON() : null
            };
        } catch (error) {
            throw new Error(`Failed to generate platform report: ${error.message}`);
        }
    }

    async getPlatformStats() {
        try {
            const stats = await analyticsRepository.getPlatformStats();
            const { lessonRepository, userRepository } = require('../repositories');

            // Получаем дополнительные данные
            const allLessons = await lessonRepository.findByTutor(1); // Получаем через любой ID, потом фильтруем
            const totalLessons = allLessons.length;

            // Получаем активных пользователей (у которых есть уроки)
            const activeStudents = await userRepository.getAll(1); // role_id = 1 для студентов
            const activeTutors = await userRepository.getAll(2); // role_id = 2 для репетиторов

            // Добавляем динамику (можно сравнить с предыдущим периодом)
            const recentReports = await analyticsRepository.getRecentReports(2);

            let growth = {};
            if (recentReports.length >= 2) {
                const current = recentReports[0];
                const previous = recentReports[1];
                const currentData = current.toJSON ? current.toJSON() : current;
                const previousData = previous.toJSON ? previous.toJSON() : previous;

                growth.rating_growth = (parseFloat(currentData.avg_rating) || 0) - (parseFloat(previousData.avg_rating) || 0);
                growth.satisfaction_growth = (parseFloat(currentData.avg_satisfaction) || 0) - (parseFloat(previousData.avg_satisfaction) || 0);
            }

            // Вычисляем индекс эффективности (простая формула)
            const avgRating = parseFloat(stats.platform_avg_rating) || 0;
            const avgSatisfaction = parseFloat(stats.platform_avg_satisfaction) || 0;
            const efficiencyIndex = ((avgRating + avgSatisfaction) / 2) * 20; // Масштабируем до 0-100

            return {
                ...stats,
                active_students: parseInt(stats.total_students) || 0,
                active_tutors: parseInt(stats.total_tutors) || 0,
                total_lessons: parseInt(stats.completed_lessons) || 0,
                efficiency_index: efficiencyIndex,
                growth
            };
        } catch (error) {
            throw new Error(`Failed to get platform stats: ${error.message}`);
        }
    }

    async getSubjectAnalytics() {
        try {
            const subjectPopularity = await analyticsRepository.getSubjectPopularity();

            // Добавляем дополнительную статистику по предметам
            const subjectsWithDetails = await Promise.all(
                subjectPopularity.map(async (subject) => {
                    // Находим репетиторов по предмету
                    const tutors = await userRepository.getAll(2); // Все репетиторы
                    const tutorsForSubject = tutors.filter(t => t.subject_id === subject.subject_id);

                    // Собираем статистику по репетиторам
                    let totalLessons = 0;
                    let totalRevenue = 0;
                    let averageRating = 0;

                    for (const tutor of tutorsForSubject) {
                        const lessons = await lessonRepository.findByTutor(tutor.user_id);
                        totalLessons += lessons.filter(l => l.is_completed).length;

                        // Предполагаем среднюю цену за урок
                        totalRevenue += lessons.filter(l => l.is_completed).length * 1500; // Примерная цена

                        const rating = await reviewRepository.getTutorAverageRating(tutor.user_id);
                        averageRating += parseFloat(rating.avg_rating) || 0;
                    }

                    averageRating = tutorsForSubject.length > 0 ? averageRating / tutorsForSubject.length : 0;

                    return {
                        ...subject,
                        tutors_count: tutorsForSubject.length,
                        completed_lessons: totalLessons,
                        estimated_revenue: totalRevenue,
                        average_rating: averageRating.toFixed(2)
                    };
                })
            );

            return subjectsWithDetails;
        } catch (error) {
            throw new Error(`Failed to get subject analytics: ${error.message}`);
        }
    }

    async getTutorPerformance(tutor_id) {
        try {
            const tutor = await userRepository.findById(tutor_id);
            if (!tutor || tutor.role_id !== 2) {
                throw new Error('Tutor not found');
            }

            const reviews = await reviewRepository.findByTutor(tutor_id);
            const lessons = await lessonRepository.findByTutor(tutor_id);
            const surveys = await surveyRepository.findByTargetUser(tutor_id);

            const completedLessons = lessons.filter(l => l.is_completed);
            const upcomingLessons = lessons.filter(l => !l.is_completed);

            const ratingStats = await reviewRepository.getTutorAverageRating(tutor_id);
            const satisfactionStats = await surveyRepository.getAverageSatisfaction(tutor_id);

            // Рассчитываем загруженность
            const monthlyLessons = completedLessons.filter(lesson => {
                const lessonDate = new Date(lesson.lesson_date);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return lessonDate >= monthAgo;
            }).length;

            return {
                tutor: tutor.toSafeJSON(),
                statistics: {
                    total_reviews: reviews.length,
                    total_lessons: lessons.length,
                    completed_lessons: completedLessons.length,
                    upcoming_lessons: upcomingLessons.length,
                    monthly_lessons: monthlyLessons,
                    average_rating: ratingStats.avg_rating || 0,
                    average_satisfaction: satisfactionStats.avg_satisfaction || 0,
                    average_knowledge_growth: satisfactionStats.avg_knowledge_growth || 0
                },
                recent_reviews: reviews.slice(0, 5),
                recent_surveys: surveys.slice(0, 5)
            };
        } catch (error) {
            throw new Error(`Failed to get tutor performance: ${error.message}`);
        }
    }

    async getRecentReports(limit = 10) {
        try {
            return await analyticsRepository.getRecentReports(limit);
        } catch (error) {
            throw new Error(`Failed to get recent reports: ${error.message}`);
        }
    }
}

module.exports = new AnalyticsService();