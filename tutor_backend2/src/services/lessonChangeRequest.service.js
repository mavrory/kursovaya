const {
    lessonChangeRequestRepository,
    lessonRepository,
    userRepository
} = require('../repositories');

class LessonChangeRequestService {
    // async requestLessonChange(changeData) {
    //     try {
    //         const { lesson_id, requester_id, proposed_date, proposed_time, comment } = changeData;
    //
    //         // Проверяем существование урока
    //         const lesson = await lessonRepository.findById(lesson_id);
    //         if (!lesson) {
    //             throw new Error('Lesson not found');
    //         }
    //
    //         // Проверяем существование пользователя
    //         const requester = await userRepository.findById(requester_id);
    //         if (!requester) {
    //             throw new Error('Requester not found');
    //         }
    //
    //         // Проверяем, что запрашивающий - участник урока
    //         if (requester_id !== lesson.student_id && requester_id !== lesson.tutor_id) {
    //             throw new Error('Only lesson participants can request changes');
    //         }
    //
    //         // Проверяем, не завершен ли уже урок
    //         if (lesson.is_completed) {
    //             throw new Error('Cannot change completed lesson');
    //         }
    //
    //         // Проверяем, нет ли уже pending запросов на этот урок
    //         const pendingCount = await lessonChangeRequestRepository.getPendingCountForLesson(lesson_id);
    //         if (pendingCount > 0) {
    //             throw new Error('There is already a pending change request for this lesson');
    //         }
    //
    //         // Создаем запрос на изменение
    //         return await lessonChangeRequestRepository.create({
    //             lesson_id,
    //             requester_id,
    //             proposed_date,
    //             proposed_time,
    //             comment
    //         });
    //     } catch (error) {
    //         throw new Error(`Failed to request lesson change: ${error.message}`);
    //     }
    // }




    async requestLessonChange(changeData) {
        try {
            const { lesson_id, requester_id, proposed_date, proposed_time, comment } = changeData;

            // Проверка и валидация
            const lesson = await lessonRepository.findById(lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }
            if (requester_id !== lesson.student_id && requester_id !== lesson.tutor_id) {
                throw new Error('Only lesson participants can request changes');
            }
            if (lesson.is_completed) {
                throw new Error('Cannot change completed lesson');
            }

            // Дополнительная проверка на уже существующий pending запрос
            const pendingCount = await lessonChangeRequestRepository.getPendingCountForLesson(lesson_id);
            if (pendingCount > 0) {
                throw new Error('There is already a pending change request for this lesson');
            }

            // СОЗДАЕМ ЗАПРОС НА ИЗМЕНЕНИЕ
            // ВСЕ данные хранятся только в lesson_change_request, НЕ обновляем таблицу lesson
            const changeRequest = await lessonChangeRequestRepository.create({
                lesson_id,
                requester_id,
                proposed_date,
                proposed_time,
                comment,
                status: 'pending'
            });

            return changeRequest;
        } catch (error) {
            throw new Error(`Failed to request lesson change: ${error.message}`);
        }
    }

    // Существующий метод: Обработка (принятие/отклонение) запроса по change_id
    async processChangeRequest(change_id, processor_id, action) {
        try {
            const changeRequest = await lessonChangeRequestRepository.findById(change_id);
            if (!changeRequest) {
                throw new Error('Change request not found');
            }

            const lesson = await lessonRepository.findById(changeRequest.lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            if (changeRequest.status !== 'pending') {
                throw new Error('Only pending requests can be processed');
            }

            // Проверка, что обработчик - не автор и участник урока
            if (changeRequest.requester_id === processor_id) {
                throw new Error('Cannot process your own change request');
            }
            if (processor_id !== lesson.student_id && processor_id !== lesson.tutor_id) {
                throw new Error('Not authorized to process this request');
            }

            if (action === 'accept') {
                // 1. Обновляем статус запроса
                await lessonChangeRequestRepository.updateStatus(change_id, 'accepted');

                // 2. Обновляем дату и время урока в таблице lesson
                // ПРЕДПОЛОЖИМ, что урок длится 1 час
                const endTime = await this.calculateEndTime(changeRequest.proposed_time);

                await lessonRepository.update(lesson.lesson_id, {
                    lesson_date: changeRequest.proposed_date,
                    start_time: changeRequest.proposed_time,
                    end_time: endTime
                });

                return { ...changeRequest, status: 'accepted', lessonUpdated: true };

            } else if (action === 'reject') {
                // 1. Обновляем статус запроса
                await lessonChangeRequestRepository.updateStatus(change_id, 'rejected');

                // 2. НИЧЕГО не делаем с уроком - оставляем старую дату

                return { ...changeRequest, status: 'rejected', lessonUpdated: false };
            } else {
                throw new Error('Invalid action');
            }
        } catch (error) {
            throw new Error(`Failed to process change request: ${error.message}`);
        }
    }

// Добавьте вспомогательный метод для расчета end_time
    async calculateEndTime(startTime) {
        // Предполагаем, что урок длится 1 час
        // startTime в формате 'HH:MM:SS'
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = hours + 1;
        return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    async processByLessonId(lesson_id, user_id, action) {
        if (action !== 'accept' && action !== 'reject') {
            throw new Error('Invalid action provided');
        }

        try {
            // 1. Найти ожидающий запрос на изменение для этого урока
            const pendingRequest = await lessonChangeRequestRepository.findPendingByLessonId(lesson_id);

            if (!pendingRequest) {
                throw new Error('Pending change request not found for this lesson.');
            }

            const lesson = await lessonRepository.findById(lesson_id);

            // 2. Проверить, что текущий пользователь является ответной стороной
            const isRequester = pendingRequest.requester_id === user_id;

            // Определяем ID ответчика (второго участника урока)
            const responder_id = lesson.student_id === pendingRequest.requester_id
                ? lesson.tutor_id
                : lesson.student_id;

            if (user_id !== responder_id) {
                throw new Error('Not authorized to process this request.');
            }

            // 3. Обновить статус запроса
            const newStatus = action === 'accept' ? 'accepted' : 'rejected';
            const updatedRequest = await lessonChangeRequestRepository.updateStatus(
                pendingRequest.change_id,
                newStatus,
                user_id
            );

            let updatedLesson = null;

            // 4. Если запрос принят, обновить данные урока
            if (newStatus === 'accepted') {
                // Предполагаем, что урок длится 1 час
                const endTime = await this.calculateEndTime(pendingRequest.proposed_time);

                updatedLesson = await lessonRepository.update(lesson_id, {
                    lesson_date: pendingRequest.proposed_date,
                    start_time: pendingRequest.proposed_time,
                    end_time: endTime
                });
            }

            // 5. Вернуть результат
            return {
                request: updatedRequest,
                lesson: updatedLesson
            };

        } catch (error) {
            throw new Error(`Failed to process lesson change request: ${error.message}`);
        }
    }






    async getChangeRequests(lesson_id, user_id, user_role) {
        try {
            const lesson = await lessonRepository.findById(lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Проверяем права доступа
            const isParticipant = user_id === lesson.student_id || user_id === lesson.tutor_id;
            if (!isParticipant && user_role !== 'admin') {
                throw new Error('Not authorized to view change requests for this lesson');
            }

            return await lessonChangeRequestRepository.findByLesson(lesson_id);
        } catch (error) {
            throw new Error(`Failed to get change requests: ${error.message}`);
        }
    }

    async getUserChangeRequests(user_id) {
        try {
            return await lessonChangeRequestRepository.findByRequester(user_id);
        } catch (error) {
            throw new Error(`Failed to get user change requests: ${error.message}`);
        }
    }

    async processChangeRequest(change_id, action, user_id, user_role, reason = null) {
        try {
            const changeRequest = await lessonChangeRequestRepository.findById(change_id);
            if (!changeRequest) {
                throw new Error('Change request not found');
            }

            // Получаем урок
            const lesson = await lessonRepository.findById(changeRequest.lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Проверяем права
            const isParticipant = user_id === lesson.student_id || user_id === lesson.tutor_id;
            const isOppositeParticipant = changeRequest.requester_id !== user_id && isParticipant;

            if (!isOppositeParticipant && user_role !== 'admin') {
                throw new Error('Not authorized to process this change request');
            }

            switch (action.toLowerCase()) {
                case 'approve':
                    return await this.approveChangeRequest(change_id);
                case 'reject':
                    return await this.rejectChangeRequest(change_id, reason);
                default:
                    throw new Error('Invalid action. Use "approve" or "reject"');
            }
        } catch (error) {
            throw new Error(`Failed to process change request: ${error.message}`);
        }
    }

    async approveChangeRequest(change_id) {
        try {
            return await lessonChangeRequestRepository.approveRequest(change_id);
        } catch (error) {
            throw new Error(`Failed to approve change request: ${error.message}`);
        }
    }

    async rejectChangeRequest(change_id, reason) {
        try {
            return await lessonChangeRequestRepository.rejectRequest(change_id, reason);
        } catch (error) {
            throw new Error(`Failed to reject change request: ${error.message}`);
        }
    }

    async getPendingRequests(user_id, user_role) {
        try {
            if (user_role === 'admin') {
                return await lessonChangeRequestRepository.findByStatus('pending');
            }

            // Для репетитора/студента получаем уроки, где есть pending запросы
            const lessons = user_role === 'tutor'
                ? await lessonRepository.findByTutor(user_id)
                : await lessonRepository.findByStudent(user_id);

            const pendingRequests = [];

            for (const lesson of lessons) {
                const requests = await lessonChangeRequestRepository.findByLesson(lesson.lesson_id);
                const pending = requests.filter(req => req.status === 'pending' && req.requester_id !== user_id);
                pendingRequests.push(...pending);
            }

            return pendingRequests;
        } catch (error) {
            throw new Error(`Failed to get pending requests: ${error.message}`);
        }
    }

    async cancelChangeRequest(change_id, user_id) {
        try {
            const changeRequest = await lessonChangeRequestRepository.findById(change_id);
            if (!changeRequest) {
                throw new Error('Change request not found');
            }

            // Проверяем, что пользователь - автор запроса
            if (changeRequest.requester_id !== user_id) {
                throw new Error('Not authorized to cancel this request');
            }

            // Проверяем, что запрос еще pending
            if (changeRequest.status !== 'pending') {
                throw new Error('Only pending requests can be cancelled');
            }

            // Удаляем запрос
            return await lessonChangeRequestRepository.delete(change_id);
        } catch (error) {
            throw new Error(`Failed to cancel change request: ${error.message}`);
        }
    }
}

module.exports = new LessonChangeRequestService();