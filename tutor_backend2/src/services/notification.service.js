const { notificationRepository } = require('../repositories');
const { lessonRepository, reviewRepository, surveyRepository } = require('../repositories');

class NotificationService {
    async getUserNotifications(user_id) {
        try {
            const { userRepository } = require('../repositories');
            
            // Получаем информацию о пользователе для определения роли
            const user = await userRepository.findById(user_id);
            if (!user) {
                return [];
            }

            const notifications = [];

            // Уведомления о предстоящих уроках (напоминания для студентов)
            try {
                const upcomingLessons = await lessonRepository.getUpcomingLessons(user_id, 'student');
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                upcomingLessons.forEach(lesson => {
                    const lessonDate = new Date(lesson.lesson_date);
                    lessonDate.setHours(0, 0, 0, 0);
                    if (lessonDate.getTime() === tomorrow.getTime()) {
                        notifications.push({
                            id: `reminder_${lesson.lesson_id}`,
                            type: 'reminder',
                            message: `Напоминание: урок завтра в ${lesson.start_time}`,
                            createdAt: new Date().toISOString()
                        });
                    }
                });
            } catch (err) {
                // Игнорируем ошибки, если пользователь не студент
            }

            // Уведомления для репетиторов
            if (user.role_id === 2) { // role_id = 2 для репетиторов
                // Уведомления о новых отзывах
                try {
                    const recentReviews = await reviewRepository.findRecentByTutor(user_id, 7); // за последние 7 дней
                    recentReviews.forEach(review => {
                        notifications.push({
                            id: `review_${review.review_id}`,
                            type: 'review',
                            message: `Новый отзыв от ${review.student_name || 'студента'}`,
                            createdAt: review.date_posted ? new Date(review.date_posted).toISOString() : new Date().toISOString()
                        });
                    });
                } catch (err) {
                    console.warn('Error getting reviews for notifications:', err);
                }

                // Уведомления о новых запросах на уроки
                try {
                    const { lessonRequestRepository } = require('../repositories');
                    const requests = await lessonRequestRepository.findByTutor(user_id);
                    const pendingRequests = requests.filter(req => req.status === 'pending');
                    
                    // Показываем только последние 5 запросов
                    pendingRequests.slice(0, 5).forEach(request => {
                        const requestData = request.toJSON ? request.toJSON() : request;
                        notifications.push({
                            id: `request_${requestData.request_id}`,
                            type: 'request',
                            message: `Новый запрос на урок от ${requestData.student_name || 'студента'}`,
                            createdAt: requestData.date_created ? new Date(requestData.date_created).toISOString() : new Date().toISOString()
                        });
                    });
                } catch (err) {
                    console.warn('Error getting requests for notifications:', err);
                }
            }

            // Сортируем по дате создания (новые первыми)
            notifications.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            return notifications;
        } catch (error) {
            throw new Error(`Failed to get notifications: ${error.message}`);
        }
    }

    async getTutorNotifications(tutor_id) {
        try {
            // Специальный метод для получения уведомлений репетитора
            return await this.getUserNotifications(tutor_id);
        } catch (error) {
            throw new Error(`Failed to get tutor notifications: ${error.message}`);
        }
    }

    async markAsRead(notification_id, user_id) {
        try {
            // Если есть таблица notifications, обновляем статус
            // Пока просто возвращаем успех
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to mark notification as read: ${error.message}`);
        }
    }

    async markAllAsRead(user_id) {
        try {
            // Если есть таблица notifications, обновляем все уведомления пользователя
            // Пока просто возвращаем успех
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to mark all notifications as read: ${error.message}`);
        }
    }
}

module.exports = new NotificationService();

