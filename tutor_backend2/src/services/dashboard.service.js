const {
    lessonRepository,
    reviewRepository,
    lessonRequestRepository
} = require('../repositories');

class DashboardService {
    async getStudentStats(student_id) {
        try {
            // Получаем все уроки студента
            const allLessons = await lessonRepository.findByStudent(student_id);
            
            // Предстоящие уроки
            const upcomingLessons = allLessons.filter(lesson => {
                const lessonDate = new Date(lesson.lesson_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return lessonDate >= today && !lesson.is_completed;
            });

            // Завершенные уроки
            const completedLessons = allLessons.filter(lesson => lesson.is_completed);

            // Получаем отзывы студента для расчета средней оценки
            const reviews = await reviewRepository.findByStudent(student_id);
            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                : 0;

            // Прогресс (процент завершенных уроков от всех запланированных)
            const totalScheduled = allLessons.length;
            const progress = totalScheduled > 0
                ? Math.round((completedLessons.length / totalScheduled) * 100)
                : 0;

            return {
                upcomingCount: upcomingLessons.length,
                completedCount: completedLessons.length,
                averageRating: parseFloat(averageRating.toFixed(1)),
                progress: progress
            };
        } catch (error) {
            throw new Error(`Failed to get student stats: ${error.message}`);
        }
    }

    async getTutorStats(tutor_id) {
        try {
            const { tutorRepository } = require('../repositories');
            
            // Получаем все уроки репетитора
            const allLessons = await lessonRepository.findByTutor(tutor_id);
            
            // Предстоящие уроки
            const upcomingLessons = allLessons.filter(lesson => {
                const lessonDate = new Date(lesson.lesson_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return lessonDate >= today && !lesson.is_completed;
            });

            // Завершенные уроки
            const completedLessons = allLessons.filter(lesson => lesson.is_completed);

            // Получаем отзывы репетитора
            const reviews = await reviewRepository.findByTutor(tutor_id);
            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                : 0;

            // Запросы на уроки
            const requests = await lessonRequestRepository.findByTutor(tutor_id);
            const pendingRequests = requests.filter(req => req.status === 'pending');

            // Получаем активных учеников (у которых есть незавершенные уроки)
            const activeStudentsSet = new Set();
            upcomingLessons.forEach(lesson => {
                activeStudentsSet.add(lesson.student_id);
            });
            const activeStudents = activeStudentsSet.size;

            // Получаем профиль репетитора для цены за час
            const tutorProfile = await tutorRepository.findById(tutor_id);
            const pricePerHour = tutorProfile ? parseFloat(tutorProfile.price_per_hour || 0) : 0;

            // Рассчитываем доход за текущий месяц
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const monthlyCompletedLessons = completedLessons.filter(lesson => {
                const lessonDate = new Date(lesson.lesson_date);
                return lessonDate.getMonth() === currentMonth && 
                       lessonDate.getFullYear() === currentYear;
            });

            // Рассчитываем доход (количество завершенных уроков * цена за час)
            // Предполагаем, что каждый урок длится 1 час
            const monthlyEarnings = monthlyCompletedLessons.length * pricePerHour;

            // Рассчитываем доход за прошлый месяц для сравнения
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            
            const lastMonthCompletedLessons = completedLessons.filter(lesson => {
                const lessonDate = new Date(lesson.lesson_date);
                return lessonDate.getMonth() === lastMonth && 
                       lessonDate.getFullYear() === lastMonthYear;
            });

            const lastMonthEarnings = lastMonthCompletedLessons.length * pricePerHour;
            
            // Рассчитываем рост доходов в процентах
            let earningsGrowth = 0;
            if (lastMonthEarnings > 0) {
                earningsGrowth = Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100);
            } else if (monthlyEarnings > 0) {
                earningsGrowth = 100; // Если в прошлом месяце не было дохода, а в этом есть
            }

            return {
                upcomingCount: upcomingLessons.length,
                activeStudents: activeStudents,
                averageRating: parseFloat(averageRating.toFixed(1)),
                reviewsCount: reviews.length,
                monthlyEarnings: monthlyEarnings,
                earningsGrowth: earningsGrowth
            };
        } catch (error) {
            throw new Error(`Failed to get tutor stats: ${error.message}`);
        }
    }
}

module.exports = new DashboardService();

