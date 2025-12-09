const {
    lessonRequestRepository,
    userRepository,
    tutorRepository,
    subjectRepository,
    lessonRepository
} = require('../repositories');

class LessonRequestService {
    async createLessonRequest(requestData) {
        try {
            const { student_id, tutor_id, subject_id, scheduled_time, message } = requestData;

            // Проверяем существование студента
            const student = await userRepository.findById(student_id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Проверяем, что студент действительно студент
            const studentRole = await userRepository.getUserRole(student_id);
            if (studentRole.role_name !== 'student') {
                throw new Error('Only students can request lessons');
            }

            // Проверяем существование репетитора
            const tutor = await tutorRepository.findById(tutor_id);
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            // Проверяем, что репетитор действительно репетитор
            const tutorRole = await userRepository.getUserRole(tutor_id);
            if (tutorRole.role_name !== 'tutor') {
                throw new Error('User is not a tutor');
            }

            // Проверяем существование предмета
            if (subject_id) {
                const subject = await subjectRepository.findById(subject_id);
                if (!subject) {
                    throw new Error('Subject not found');
                }
            }

            // Проверяем, что scheduled_time в будущем
            const scheduledTime = new Date(scheduled_time);
            const now = new Date();
            if (scheduledTime <= now) {
                throw new Error('Lesson must be scheduled in the future');
            }

            // Проверяем, нет ли уже активного запроса от этого студента к этому репетитору
            const existingRequests = await lessonRequestRepository.findByStudent(student_id);
            const activeRequest = existingRequests.find(req =>
                req.tutor_id === tutor_id &&
                req.status === 'pending' &&
                new Date(req.scheduled_time).toDateString() === scheduledTime.toDateString()
            );

            if (activeRequest) {
                throw new Error('You already have a pending request with this tutor for this time');
            }

            // Создаем запрос на урок
            const lessonRequest = await lessonRequestRepository.create({
                student_id,
                tutor_id,
                subject_id,
                scheduled_time: scheduledTime
            });

            // Можно добавить отправку уведомления репетитору
            // await this.sendNotificationToTutor(tutor_id, student_id, scheduledTime);

            return lessonRequest;
        } catch (error) {
            throw new Error(`Failed to create lesson request: ${error.message}`);
        }
    }

    async getLessonRequestById(request_id, user_id, user_role) {
        try {
            const request = await lessonRequestRepository.findById(request_id);
            if (!request) {
                throw new Error('Lesson request not found');
            }

            // Проверяем права доступа
            const hasAccess = user_role === 'admin' ||
                request.student_id === user_id ||
                request.tutor_id === user_id;

            if (!hasAccess) {
                throw new Error('Not authorized to view this lesson request');
            }

            return request;
        } catch (error) {
            throw new Error(`Failed to get lesson request: ${error.message}`);
        }
    }

    async getLessonRequestsByUser(user_id, user_role) {
        try {
            if (user_role === 'student') {
                return await lessonRequestRepository.findByStudent(user_id);
            } else if (user_role === 'tutor') {
                return await lessonRequestRepository.findByTutor(user_id);
            } else if (user_role === 'admin') {
                // Админ видит все запросы
                // Нужно добавить метод getAll в репозиторий
                const studentRequests = await lessonRequestRepository.findByStudent(user_id);
                const tutorRequests = await lessonRequestRepository.findByTutor(user_id);
                return [...studentRequests, ...tutorRequests];
            } else {
                throw new Error('Invalid role');
            }
        } catch (error) {
            throw new Error(`Failed to get lesson requests: ${error.message}`);
        }
    }

    async updateLessonRequestStatus(request_id, status, user_id, user_role) {
        try {
            const request = await lessonRequestRepository.findById(request_id);
            if (!request) {
                throw new Error('Lesson request not found');
            }

            // Проверяем права
            if (user_role === 'tutor' && request.tutor_id !== user_id) {
                throw new Error('Only the assigned tutor can update request status');
            }

            if (user_role === 'student' && request.student_id !== user_id) {
                throw new Error('Only the student who made the request can update it');
            }

            // Проверяем валидность статуса
            const validStatuses = ['pending', 'accepted', 'rejected', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            // Если запрос уже не в pending, нельзя менять статус
            if (request.status !== 'pending' && user_role !== 'admin') {
                throw new Error('Cannot change status of a processed request');
            }

            // Обновляем статус
            const updatedRequest = await lessonRequestRepository.updateStatus(request_id, status);

            // Если запрос принят, создаем урок
            if (status === 'accepted') {
                await this.createLessonFromRequest(request);

                // Можно добавить отправку уведомления студенту
                // await this.sendNotificationToStudent(request.student_id, request.tutor_id, request.scheduled_time);
            }

            // Если запрос отклонен или отменен, можно отправить уведомление
            if (status === 'rejected' || status === 'cancelled') {
                const recipientId = status === 'rejected' ? request.student_id : request.tutor_id;
                // await this.sendRejectionNotification(recipientId, request_id, status);
            }

            return updatedRequest;
        } catch (error) {
            throw new Error(`Failed to update lesson request status: ${error.message}`);
        }
    }

    async createLessonFromRequest(request) {
        try {
            // Преобразуем scheduled_time в формат для урока
            const scheduledTime = new Date(request.scheduled_time);
            const lesson_date = scheduledTime.toISOString().split('T')[0];
            const start_time = scheduledTime.toTimeString().split(' ')[0];

            // Предполагаем длительность урока 1 час
            const endTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
            const end_time = endTime.toTimeString().split(' ')[0];

            // Создаем урок
            const lesson = await lessonRepository.create({
                request_id: request.request_id,
                tutor_id: request.tutor_id,
                student_id: request.student_id,
                lesson_date,
                start_time,
                end_time,
                is_completed: false
            });

            return lesson;
        } catch (error) {
            throw new Error(`Failed to create lesson from request: ${error.message}`);
        }
    }

    async cancelLessonRequest(request_id, user_id, user_role) {
        try {
            const request = await lessonRequestRepository.findById(request_id);
            if (!request) {
                throw new Error('Lesson request not found');
            }

            // Проверяем права
            const canCancel = user_role === 'admin' ||
                (user_role === 'student' && request.student_id === user_id) ||
                (user_role === 'tutor' && request.tutor_id === user_id);

            if (!canCancel) {
                throw new Error('Not authorized to cancel this lesson request');
            }

            // Проверяем, что запрос еще pending
            if (request.status !== 'pending') {
                throw new Error('Only pending requests can be cancelled');
            }

            // Отменяем запрос
            return await lessonRequestRepository.updateStatus(request_id, 'cancelled');
        } catch (error) {
            throw new Error(`Failed to cancel lesson request: ${error.message}`);
        }
    }

    async getPendingRequestsCount(user_id, user_role) {
        try {
            if (user_role === 'tutor') {
                const requests = await lessonRequestRepository.findByTutor(user_id);
                return requests.filter(req => req.status === 'pending').length;
            } else if (user_role === 'student') {
                const requests = await lessonRequestRepository.findByStudent(user_id);
                return requests.filter(req => req.status === 'pending').length;
            } else {
                return 0;
            }
        } catch (error) {
            console.error('Error getting pending requests count:', error);
            return 0;
        }
    }

    async getRequestStatistics(user_id, user_role) {
        try {
            let requests;

            if (user_role === 'student') {
                requests = await lessonRequestRepository.findByStudent(user_id);
            } else if (user_role === 'tutor') {
                requests = await lessonRequestRepository.findByTutor(user_id);
            } else {
                return null;
            }

            const statistics = {
                total: requests.length,
                pending: requests.filter(req => req.status === 'pending').length,
                accepted: requests.filter(req => req.status === 'accepted').length,
                rejected: requests.filter(req => req.status === 'rejected').length,
                cancelled: requests.filter(req => req.status === 'cancelled').length,
                completed: 0 // нужно считать через lessons
            };

            // Для принятых запросов проверяем, созданы ли уроки и завершены ли они
            const acceptedRequests = requests.filter(req => req.status === 'accepted');
            for (const request of acceptedRequests) {
                // Здесь нужно проверить, есть ли урок для этого запроса и завершен ли он
                // Пока оставляем 0
            }

            return statistics;
        } catch (error) {
            console.error('Error getting request statistics:', error);
            return null;
        }
    }

    async rescheduleLessonRequest(request_id, new_time, user_id, user_role) {
        try {
            const request = await lessonRequestRepository.findById(request_id);
            if (!request) {
                throw new Error('Lesson request not found');
            }

            // Проверяем права
            const canReschedule = user_role === 'admin' ||
                (user_role === 'student' && request.student_id === user_id);

            if (!canReschedule) {
                throw new Error('Not authorized to reschedule this lesson request');
            }

            // Проверяем, что запрос еще pending
            if (request.status !== 'pending') {
                throw new Error('Only pending requests can be rescheduled');
            }

            // Проверяем, что новое время в будущем
            const newTime = new Date(new_time);
            const now = new Date();
            if (newTime <= now) {
                throw new Error('New time must be in the future');
            }

            // Здесь нужен метод update в LessonRequestRepository
            // Пока возвращаем обновленные данные
            return {
                ...request.toJSON(),
                scheduled_time: newTime,
                status: 'pending' // сбрасываем статус на pending для подтверждения репетитором
            };
        } catch (error) {
            throw new Error(`Failed to reschedule lesson request: ${error.message}`);
        }
    }
}

module.exports = new LessonRequestService();