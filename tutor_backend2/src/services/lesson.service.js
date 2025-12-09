const {
    lessonRepository,
    lessonRequestRepository,
    userRepository,
    tutorRepository,
    reviewRepository,
    lessonChangeRequestRepository
} = require('../repositories');
const database = require('../config/database');

class LessonService {
    async requestLesson(requestData) {
        try {
            const { student_id, tutor_id, subject_id, scheduled_time } = requestData;

            // Проверяем существование пользователей
            const student = await userRepository.findById(student_id);
            const tutor = await tutorRepository.findById(tutor_id);

            if (!student) {
                throw new Error('Student not found');
            }
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            // Проверяем доступность времени (можно добавить логику)
            // ...

            // Создаем запрос на урок
            return await lessonRequestRepository.create({
                student_id,
                tutor_id,
                subject_id,
                scheduled_time
            });
        } catch (error) {
            throw new Error(`Failed to request lesson: ${error.message}`);
        }
    }

    async getLessonRequests(user_id, role) {
        try {
            if (role === 'student') {
                return await lessonRequestRepository.findByStudent(user_id);
            } else if (role === 'tutor') {
                return await lessonRequestRepository.findByTutor(user_id);
            } else {
                throw new Error('Invalid role');
            }
        } catch (error) {
            throw new Error(`Failed to get lesson requests: ${error.message}`);
        }
    }

    async processLessonRequest(request_id, action, user_id, user_role) {
        try {
            const request = await lessonRequestRepository.findById(request_id);
            if (!request) {
                throw new Error('Lesson request not found');
            }

            // Проверяем права
            if (user_role === 'tutor' && request.tutor_id !== user_id) {
                throw new Error('Not authorized to process this request');
            }

            if (user_role === 'student' && request.student_id !== user_id) {
                throw new Error('Not authorized to process this request');
            }

            let newStatus;
            switch (action) {
                case 'accept':
                    newStatus = 'accepted';
                    // Создаем урок при принятии запроса
                    await this.createLessonFromRequest(request);
                    break;
                case 'reject':
                    newStatus = 'rejected';
                    break;
                case 'cancel':
                    newStatus = 'cancelled';
                    break;
                default:
                    throw new Error('Invalid action');
            }

            return await lessonRequestRepository.updateStatus(request_id, newStatus);
        } catch (error) {
            throw new Error(`Failed to process lesson request: ${error.message}`);
        }
    }

    async createLessonFromRequest(request) {
        try {
            // Преобразуем scheduled_time в date и time
            const scheduledTime = new Date(request.scheduled_time);
            const lesson_date = scheduledTime.toISOString().split('T')[0];
            const start_time = scheduledTime.toTimeString().split(' ')[0];

            // Предполагаем длительность урока 1 час
            const endTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
            const end_time = endTime.toTimeString().split(' ')[0];

            return await lessonRepository.create({
                request_id: request.request_id,
                tutor_id: request.tutor_id,
                student_id: request.student_id,
                lesson_date,
                start_time,
                end_time
            });
        } catch (error) {
            throw new Error(`Failed to create lesson from request: ${error.message}`);
        }
    }

    async getLessons(user_id, role) {
        try {
            let lessons = [];
            
            // Получаем созданные уроки
            if (role === 'student') {
                lessons = await lessonRepository.findByStudent(user_id);
            } else if (role === 'tutor') {
                lessons = await lessonRepository.findByTutor(user_id);
            } else {
                throw new Error('Invalid role');
            }
            
            // Получаем pending requests, которые еще не созданы как уроки
            let pendingRequests = [];
            if (role === 'student') {
                pendingRequests = await lessonRequestRepository.findByStudent(user_id);
            } else if (role === 'tutor') {
                pendingRequests = await lessonRequestRepository.findByTutor(user_id);
            }
            
            // Фильтруем только pending requests, которые еще не имеют связанного урока
            const pendingWithoutLesson = pendingRequests.filter(req => {
                return req.status === 'pending' && !lessons.find(l => l.request_id === req.request_id);
            });
            
            // Преобразуем pending requests в формат урока для форматирования
            const pendingLessons = pendingWithoutLesson.map(request => {
                // Получаем данные из объекта request (может быть модель или plain object)
                const requestData = request.toJSON ? request.toJSON() : request;
                
                // Преобразуем scheduled_time в lesson_date и start_time
                const scheduledTime = new Date(requestData.scheduled_time);
                const lesson_date = scheduledTime.toISOString().split('T')[0];
                const startTime = new Date(scheduledTime);
                const endTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000); // +1 час
                const start_time = startTime.toTimeString().split(' ')[0];
                const end_time = endTime.toTimeString().split(' ')[0];
                
                return {
                    lesson_id: null, // Нет урока еще - будет использован request_id как идентификатор
                    request_id: requestData.request_id,
                    tutor_id: requestData.tutor_id,
                    student_id: requestData.student_id,
                    lesson_date,
                    start_time,
                    end_time,
                    is_completed: false,
                    request_status: 'pending',
                    subject_id: requestData.subject_id,
                    subject_name: requestData.subject_name,
                    tutor_user_id: requestData.tutor_id,
                    tutor_name: requestData.tutor_name,
                    tutor_email: requestData.tutor_email,
                    student_user_id: requestData.student_id,
                    student_name: requestData.student_name,
                    student_email: requestData.student_email,
                    price_per_hour: requestData.price_per_hour,
                    tutor_rating: requestData.tutor_rating
                };
            });
            
            // Объединяем уроки и pending requests
            const allLessons = [...lessons, ...pendingLessons];
            
            // Форматируем уроки для фронтенда
            return await Promise.all(allLessons.map(lesson => this.formatLessonForFrontend(lesson, role)));
        } catch (error) {
            throw new Error(`Failed to get lessons: ${error.message}`);
        }
    }

    async getUpcomingLessons(user_id, role) {
        try {
            const lessons = await lessonRepository.getUpcomingLessons(user_id, role);
            // Форматируем уроки для фронтенда
            return await Promise.all(lessons.map(lesson => this.formatLessonForFrontend(lesson, role)));
        } catch (error) {
            throw new Error(`Failed to get upcoming lessons: ${error.message}`);
        }
    }

    async formatLessonForFrontend(lessonData, userRole) {
        try {
            // Проверяем наличие обязательных полей
            // Для pending requests lesson_id может быть null, используем request_id
            if (!lessonData || (!lessonData.lesson_id && !lessonData.request_id)) {
                throw new Error('Invalid lesson data: missing lesson_id or request_id');
            }

            // Вычисляем duration в минутах
            if (!lessonData.start_time || !lessonData.end_time) {
                console.error('Missing time data:', {
                    lesson_id: lessonData.lesson_id,
                    start_time: lessonData.start_time,
                    end_time: lessonData.end_time,
                    start_time_type: typeof lessonData.start_time,
                    end_time_type: typeof lessonData.end_time
                });
                throw new Error('Missing time data for lesson');
            }
            
            // Нормализуем формат времени (PostgreSQL может вернуть TIME с микросекундами)
            const normalizeTime = (timeValue) => {
                if (!timeValue) return null;
                
                // Если это объект Date, преобразуем в строку
                if (timeValue instanceof Date) {
                    const hours = timeValue.getHours().toString().padStart(2, '0');
                    const minutes = timeValue.getMinutes().toString().padStart(2, '0');
                    const seconds = timeValue.getSeconds().toString().padStart(2, '0');
                    return `${hours}:${minutes}:${seconds}`;
                }
                
                // Если это уже строка
                let timeStr = timeValue.toString().trim();
                
                // Убираем лишние пробелы и берем только время (HH:MM:SS или HH:MM:SS.microseconds)
                timeStr = timeStr.split(' ')[0];
                
                // Убираем микросекунды, если есть (07:21:18.723799 -> 07:21:18)
                if (timeStr.includes('.')) {
                    timeStr = timeStr.split('.')[0];
                }
                
                // Проверяем формат (должен быть HH:MM или HH:MM:SS)
                const timeRegex = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/;
                if (!timeRegex.test(timeStr)) {
                    console.error('Invalid time format:', {
                        original: timeValue,
                        type: typeof timeValue,
                        stringified: timeStr
                    });
                    throw new Error(`Invalid time format: ${timeValue} (type: ${typeof timeValue})`);
                }
                
                // Нормализуем до HH:MM:SS
                const parts = timeStr.split(':');
                if (parts.length === 2) {
                    return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
                }
                return `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2] || '00'}`;
            };
            
            const startTimeStr = normalizeTime(lessonData.start_time);
            const endTimeStr = normalizeTime(lessonData.end_time);
            
            if (!startTimeStr || !endTimeStr) {
                throw new Error('Invalid time format');
            }
            
            // Парсим время вручную для расчета duration
            const parseTime = (timeStr) => {
                const parts = timeStr.split(':');
                if (parts.length < 2) throw new Error(`Invalid time format: ${timeStr}`);
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
                
                if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                    throw new Error(`Invalid time values: ${timeStr}`);
                }
                
                return hours * 60 + minutes + seconds / 60; // Возвращаем минуты
            };
            
            const startMinutes = parseTime(startTimeStr);
            const endMinutes = parseTime(endTimeStr);
            const duration = Math.round(endMinutes - startMinutes);

            // Формируем scheduledFor как ISO строку
            if (!lessonData.lesson_date) {
                throw new Error('Missing lesson date');
            }
            
            // Нормализуем дату (PostgreSQL может вернуть DATE как строку 'YYYY-MM-DD' или как объект Date)
            let dateStr;
            
            if (lessonData.lesson_date instanceof Date) {
                // Если это объект Date, преобразуем в строку YYYY-MM-DD
                const year = lessonData.lesson_date.getFullYear();
                const month = String(lessonData.lesson_date.getMonth() + 1).padStart(2, '0');
                const day = String(lessonData.lesson_date.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } else {
                // Если это строка, нормализуем её
                dateStr = lessonData.lesson_date.toString().trim();
                // Убираем время, если есть
                dateStr = dateStr.split('T')[0].split(' ')[0];
            }
            
            // Проверяем формат даты
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateStr)) {
                console.error('Invalid date format:', {
                    original: lessonData.lesson_date,
                    type: typeof lessonData.lesson_date,
                    stringified: dateStr
                });
                throw new Error(`Invalid date format: ${lessonData.lesson_date}`);
            }
            
            // Создаем ISO строку
            const dateTimeStr = `${dateStr}T${startTimeStr}`;
            const scheduledDate = new Date(dateTimeStr);
            
            if (isNaN(scheduledDate.getTime())) {
                throw new Error(`Invalid date/time combination: ${dateTimeStr}`);
            }
            
            const scheduledFor = scheduledDate.toISOString();

            // Определяем status
            let status = 'scheduled';
            let cancelledReason = null;
            let cancelledAt = null;
            
            // Проверяем статус запроса на урок
            if (lessonData.request_status === 'pending') {
                status = 'pending';
            } else if (lessonData.request_status === 'rejected') {
                status = 'cancelled';
                cancelledReason = 'Урок отклонен репетитором';
                // Можно добавить логику для получения причины отмены из lesson_change_request
            } else if (lessonData.is_completed) {
                status = 'completed';
            } else if (lessonData.request_status === 'accepted' || !lessonData.request_status) {
                // Если статус accepted или нет request (урок создан напрямую)
                // Проверяем, не отменен ли урок через lesson_change_request
                try {
                    const changeRequests = await lessonChangeRequestRepository.findByLesson(lessonData.lesson_id);
                    const rejectedChange = changeRequests.find(cr => cr.status === 'rejected' && cr.comment);
                    if (rejectedChange && rejectedChange.comment) {
                        // Если есть отклоненный запрос на изменение, это не отмена урока
                    }
                } catch (err) {
                    // Игнорируем ошибки при проверке запросов на изменение
                }
                status = 'scheduled';
            }

            // Формируем предмет (возвращаем строку, как в требованиях)
            const subject = lessonData.subject_name || null;

            // Формируем объект репетитора
            const tutor = {
                id: lessonData.tutor_user_id || lessonData.tutor_id || null,
                name: lessonData.tutor_name || 'Не указано',
                rating: parseFloat(lessonData.tutor_rating || 0).toFixed(1),
                avatar: null // Пока нет поля avatar в БД
            };

            // Формируем объект студента
            const student = {
                id: lessonData.student_user_id || lessonData.student_id || null,
                name: lessonData.student_name || 'Не указано',
                avatar: null // Пока нет поля avatar в БД
            };

            // Получаем review если урок завершен
            let review = null;
            let rating = null;
            let completedAt = null;
            if (lessonData.is_completed && lessonData.lesson_id) {
                try {
                    const lessonReview = await reviewRepository.findByLesson(lessonData.lesson_id);
                    if (lessonReview) {
                        review = lessonReview.comment || null;
                        rating = lessonReview.rating || null;
                        completedAt = lessonReview.date_posted ? new Date(lessonReview.date_posted).toISOString() : null;
                    }
                } catch (reviewError) {
                    // Игнорируем ошибки при получении review, это не критично
                    console.warn('Error fetching review for lesson:', lessonData.lesson_id, reviewError.message);
                }
            }

            // Формируем результат в формате, ожидаемом фронтендом
            // Используем request_id как идентификатор, если lesson_id отсутствует (для pending requests)
            const result = {
                lesson_id: lessonData.lesson_id || lessonData.request_id, // Для pending используем request_id
                subject_name: subject, // Строка или null
                scheduled_for: scheduledFor, // ISO строка (объединенные date + time)
                duration: duration, // В минутах
                price: parseFloat(lessonData.price_per_hour || 0),
                status: status,
                description: `Урок по ${subject || 'предмету'}`,
                // Опциональные поля для встреч
                meeting_link: null, // Пока нет в БД
                meeting_platform: null, // Пока нет в БД
            };

            // Добавляем tutor или student в зависимости от роли
            if (userRole === 'student') {
                result.tutor = {
                    user_id: lessonData.tutor_user_id || lessonData.tutor_id || null,
                    id: lessonData.tutor_user_id || lessonData.tutor_id || null, // Для совместимости
                    name: lessonData.tutor_name || 'Не указано',
                    email: lessonData.tutor_email || null,
                    avatar_url: null, // Пока нет в БД
                    avatar: null // Для совместимости
                };
            } else {
                result.student = {
                    user_id: lessonData.student_user_id || lessonData.student_id || null,
                    id: lessonData.student_user_id || lessonData.student_id || null, // Для совместимости
                    name: lessonData.student_name || 'Не указано',
                    email: lessonData.student_email || null,
                    avatar_url: null, // Пока нет в БД
                    avatar: null // Для совместимости
                };
            }

            // Добавляем данные о завершении (если урок завершен)
            if (lessonData.is_completed) {
                result.rating = rating;
                result.review = review;
                result.completed_at = completedAt;
            }

            // Добавляем данные об отмене (если урок отменен)
            if (status === 'cancelled') {
                result.cancelled_reason = cancelledReason;
                result.cancelled_at = cancelledAt;
            }

            return result;
        } catch (error) {
            throw new Error(`Failed to format lesson: ${error.message}`);
        }
    }

    async handleLessonAction(lesson_id, action, user_id, user_role, actionData = {}) {
        try {
            // Проверяем, является ли это request_id (для pending requests)
            let lesson = await lessonRepository.findById(lesson_id);
            let request = null;
            
            if (!lesson) {
                // Возможно, это request_id для pending request
                request = await lessonRequestRepository.findById(lesson_id);
                if (!request) {
                    throw new Error('Lesson or request not found');
                }
            } else {
                // Если есть урок, проверяем, есть ли связанный request
                if (lesson.request_id) {
                    request = await lessonRequestRepository.findById(lesson.request_id);
                }
            }

            // Проверяем права в зависимости от действия
            // Для accept/reject проверяем права отдельно, так как это действия с request
            if (action === 'accept' || action === 'reject') {
                if (!request) {
                    throw new Error('Request not found');
                }
                if (user_role !== 'tutor') {
                    throw new Error('Only tutor can accept or reject lesson requests');
                }
                if (request.tutor_id !== user_id) {
                    throw new Error('Not authorized to perform this action');
                }
            } else {
                // Для других действий проверяем стандартные права
                if (request) {
                    // Работаем с request
                    if (user_role === 'student' && request.student_id !== user_id) {
                        throw new Error('Not authorized to perform this action');
                    }
                    if (user_role === 'tutor' && request.tutor_id !== user_id) {
                        throw new Error('Not authorized to perform this action');
                    }
                } else if (lesson) {
                    // Работаем с уроком
                    if (user_role === 'student' && lesson.student_id !== user_id) {
                        throw new Error('Not authorized to perform this action');
                    }
                    if (user_role === 'tutor' && lesson.tutor_id !== user_id) {
                        throw new Error('Not authorized to perform this action');
                    }
                }
            }

            switch (action) {
                case 'cancel':
                    // Отменяем урок или запрос
                    if (request) {
                        await lessonRequestRepository.updateStatus(request.request_id, 'rejected');
                    } else if (lesson && lesson.request_id) {
                        await lessonRequestRepository.updateStatus(lesson.request_id, 'rejected');
                    }
                    // Получаем обновленные данные
                    if (lesson) {
                        const cancelledLesson = await lessonRepository.getLessonWithDetails(lesson_id);
                        return await this.formatLessonForFrontend(cancelledLesson, user_role);
                    } else if (request) {
                        // Преобразуем request в формат урока
                        const requestData = request.toJSON ? request.toJSON() : request;
                        const scheduledTime = new Date(requestData.scheduled_time);
                        const lesson_date = scheduledTime.toISOString().split('T')[0];
                        const startTime = new Date(scheduledTime);
                        const endTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
                        const start_time = startTime.toTimeString().split(' ')[0];
                        const end_time = endTime.toTimeString().split(' ')[0];
                        
                        const cancelledRequest = {
                            lesson_id: null,
                            request_id: requestData.request_id,
                            tutor_id: requestData.tutor_id,
                            student_id: requestData.student_id,
                            lesson_date,
                            start_time,
                            end_time,
                            is_completed: false,
                            request_status: 'rejected',
                            subject_id: requestData.subject_id,
                            subject_name: requestData.subject_name,
                            tutor_user_id: requestData.tutor_id,
                            tutor_name: requestData.tutor_name,
                            tutor_email: requestData.tutor_email,
                            student_user_id: requestData.student_id,
                            student_name: requestData.student_name,
                            student_email: requestData.student_email,
                            price_per_hour: requestData.price_per_hour,
                            tutor_rating: requestData.tutor_rating
                        };
                        return await this.formatLessonForFrontend(cancelledRequest, user_role);
                    }
                    break;
                
                case 'reschedule':
                    // Создаем запрос на изменение урока
                    if (!lesson) {
                        throw new Error('Cannot reschedule a pending request. Please accept it first.');
                    }
                    
                    // Проверяем, что урок еще не завершен
                    if (lesson.is_completed) {
                        throw new Error('Cannot reschedule a completed lesson');
                    }
                    
                    const { proposed_date, proposed_time, comment } = actionData;
                    if (!proposed_date || !proposed_time) {
                        throw new Error('Proposed date and time are required for rescheduling');
                    }
                    
                    // Проверяем формат даты и времени
                    const proposedDate = new Date(proposed_date);
                    const proposedTime = new Date(`1970-01-01T${proposed_time}`);
                    
                    if (isNaN(proposedDate.getTime())) {
                        throw new Error('Invalid proposed date format');
                    }
                    if (isNaN(proposedTime.getTime())) {
                        throw new Error('Invalid proposed time format');
                    }
                    
                    // Создаем запрос на изменение
                    await lessonChangeRequestRepository.create({
                        lesson_id: parseInt(lesson_id),
                        requester_id: user_id,
                        proposed_date: proposed_date,
                        proposed_time: proposed_time,
                        comment: comment || null
                    });
                    
                    const rescheduledLesson = await lessonRepository.getLessonWithDetails(lesson_id);
                    return await this.formatLessonForFrontend(rescheduledLesson, user_role);
                
                case 'accept':
                    // Принимаем урок (для репетитора - принимает запрос на урок)
                    // Проверка прав уже выполнена выше
                    await lessonRequestRepository.updateStatus(request.request_id, 'accepted');
                    // Создаем урок из принятого запроса
                    const acceptedRequest = await lessonRequestRepository.findById(request.request_id);
                    const newLesson = await this.createLessonFromRequest(acceptedRequest);
                    const acceptedLesson = await lessonRepository.getLessonWithDetails(newLesson.lesson_id);
                    return await this.formatLessonForFrontend(acceptedLesson, user_role);
                
                case 'reject':
                    // Отклоняем урок (для репетитора - отклоняет запрос на урок)
                    if (user_role !== 'tutor') {
                        throw new Error('Only tutor can reject lesson');
                    }
                    if (!request) {
                        throw new Error('Request not found');
                    }
                    await lessonRequestRepository.updateStatus(request.request_id, 'rejected');
                    // Преобразуем request в формат урока для возврата
                    const rejectedRequestData = request.toJSON ? request.toJSON() : request;
                    const rejectedScheduledTime = new Date(rejectedRequestData.scheduled_time);
                    const rejectedLessonDate = rejectedScheduledTime.toISOString().split('T')[0];
                    const rejectedStartTime = new Date(rejectedScheduledTime);
                    const rejectedEndTime = new Date(rejectedScheduledTime.getTime() + 60 * 60 * 1000);
                    const rejectedStartTimeStr = rejectedStartTime.toTimeString().split(' ')[0];
                    const rejectedEndTimeStr = rejectedEndTime.toTimeString().split(' ')[0];
                    
                    const rejectedRequest = {
                        lesson_id: null,
                        request_id: rejectedRequestData.request_id,
                        tutor_id: rejectedRequestData.tutor_id,
                        student_id: rejectedRequestData.student_id,
                        lesson_date: rejectedLessonDate,
                        start_time: rejectedStartTimeStr,
                        end_time: rejectedEndTimeStr,
                        is_completed: false,
                        request_status: 'rejected',
                        subject_id: rejectedRequestData.subject_id,
                        subject_name: rejectedRequestData.subject_name,
                        tutor_user_id: rejectedRequestData.tutor_id,
                        tutor_name: rejectedRequestData.tutor_name,
                        tutor_email: rejectedRequestData.tutor_email,
                        student_user_id: rejectedRequestData.student_id,
                        student_name: rejectedRequestData.student_name,
                        student_email: rejectedRequestData.student_email,
                        price_per_hour: rejectedRequestData.price_per_hour,
                        tutor_rating: rejectedRequestData.tutor_rating
                    };
                    return await this.formatLessonForFrontend(rejectedRequest, user_role);
                
                case 'complete':
                    if (user_role !== 'tutor') {
                        throw new Error('Only tutor can complete lesson');
                    }
                    if (!lesson) {
                        throw new Error('Lesson not found');
                    }
                    await lessonRepository.updateCompletion(lesson_id, true);
                    const completedLesson = await lessonRepository.getLessonWithDetails(lesson_id);
                    return await this.formatLessonForFrontend(completedLesson, user_role);
                
                default:
                    throw new Error(`Invalid action: ${action}`);
            }
        } catch (error) {
            throw new Error(`Failed to handle lesson action: ${error.message}`);
        }
    }

    async completeLesson(lesson_id, user_id, user_role) {
        try {
            const lesson = await lessonRepository.findById(lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Проверяем права
            if (user_role === 'tutor' && lesson.tutor_id !== user_id) {
                throw new Error('Only the tutor can mark lesson as completed');
            }

            await lessonRepository.updateCompletion(lesson_id, true);
            const completedLesson = await lessonRepository.getLessonWithDetails(lesson_id);
            return await this.formatLessonForFrontend(completedLesson, user_role);
        } catch (error) {
            throw new Error(`Failed to complete lesson: ${error.message}`);
        }
    }

    async rateLesson(lesson_id, user_id, user_role, ratingData) {
        try {
            const { rating, review } = ratingData;
            
            if (!rating || rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const lesson = await lessonRepository.findById(lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Проверяем права - только студент может оценить урок
            if (user_role !== 'student') {
                throw new Error('Only students can rate lessons');
            }

            if (lesson.student_id !== user_id) {
                throw new Error('Not authorized to rate this lesson');
            }

            // Проверяем, что урок завершен
            if (!lesson.is_completed) {
                throw new Error('Can only rate completed lessons');
            }

            // Проверяем, не оставлен ли уже отзыв
            const existingReview = await reviewRepository.findByLesson(lesson_id);
            if (existingReview) {
                // Обновляем существующий отзыв
                await reviewRepository.updateReview(existingReview.review_id, {
                    rating,
                    comment: review || null
                });
            } else {
                // Создаем новый отзыв
                await reviewRepository.create({
                    student_id: user_id,
                    tutor_id: lesson.tutor_id,
                    lesson_id: parseInt(lesson_id),
                    rating,
                    comment: review || null
                });
            }

            // Обновляем средний рейтинг репетитора
            const ratingStats = await reviewRepository.getTutorAverageRating(lesson.tutor_id);
            if (ratingStats.avg_rating) {
                await tutorRepository.updateRating(lesson.tutor_id, parseFloat(ratingStats.avg_rating));
            }

            // Возвращаем обновленный урок
            const updatedLesson = await lessonRepository.getLessonWithDetails(lesson_id);
            return await this.formatLessonForFrontend(updatedLesson, user_role);
        } catch (error) {
            throw new Error(`Failed to rate lesson: ${error.message}`);
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

    async getCompletedLessonsWithoutReview(student_id) {
        try {
            const { reviewRepository } = require('../repositories');
            
            // Получаем все завершенные уроки студента
            const lessons = await lessonRepository.findByStudent(student_id);
            const completedLessons = lessons.filter(l => l.is_completed);

            // Фильтруем уроки, для которых нет отзыва
            const lessonsWithoutReview = [];
            for (const lesson of completedLessons) {
                const existingReview = await reviewRepository.findByLesson(lesson.lesson_id);
                if (!existingReview || existingReview.student_id !== student_id) {
                    const lessonDetails = await lessonRepository.getLessonWithDetails(lesson.lesson_id);
                    lessonsWithoutReview.push({
                        lesson_id: lessonDetails.lesson_id,
                        tutor_id: lessonDetails.tutor_id,
                        tutor_name: lessonDetails.tutor_name,
                        subject_name: lessonDetails.subject_name,
                        completed_at: lessonDetails.is_completed ? new Date().toISOString() : null
                    });
                }
            }

            return lessonsWithoutReview;
        } catch (error) {
            throw new Error(`Failed to get completed lessons without review: ${error.message}`);
        }
    }

    async autoCompleteLessons() {
        try {
            // Получаем все незавершенные уроки, время которых уже прошло
            const result = await database.query(
                `SELECT l.*
         FROM lesson l
         WHERE l.is_completed = false
           AND (l.lesson_date < CURRENT_DATE 
                OR (l.lesson_date = CURRENT_DATE AND l.end_time < CURRENT_TIME))
         ORDER BY l.lesson_date, l.end_time`,
                []
            );

            const lessonsToComplete = result.rows;
            const completed = [];

            for (const lesson of lessonsToComplete) {
                try {
                    await lessonRepository.updateCompletion(lesson.lesson_id, true);
                    completed.push(lesson.lesson_id);
                } catch (error) {
                    console.error(`Error auto-completing lesson ${lesson.lesson_id}:`, error);
                }
            }

            return {
                total: lessonsToComplete.length,
                completed: completed.length,
                lesson_ids: completed
            };
        } catch (error) {
            throw new Error(`Failed to auto-complete lessons: ${error.message}`);
        }
    }
}

module.exports = new LessonService();