const { tutorRepository, userRepository, subjectRepository, reviewRepository, lessonRepository, lessonRequestRepository, tutorScheduleRepository } = require('../repositories');

class TutorService {
    async registerAsTutor(tutorData) {
        try {
            const { user_id, subject_id, experience, price_per_hour } = tutorData;

            // Проверяем существование пользователя
            const user = await userRepository.findById(user_id);
            if (!user) {
                throw new Error('User not found');
            }

            // Проверяем, не является ли уже репетитором
            const existingTutor = await tutorRepository.findById(user_id);
            if (existingTutor) {
                throw new Error('User is already registered as tutor');
            }

            // Проверяем существование предмета
            if (subject_id) {
                const subject = await subjectRepository.findById(subject_id);
                if (!subject) {
                    throw new Error('Subject not found');
                }
            }

            // Создаем профиль репетитора
            return await tutorRepository.createProfile({
                tutor_id: user_id,
                subject_id,
                experience: experience || 0,
                price_per_hour: price_per_hour || 0
            });
        } catch (error) {
            throw new Error(`Failed to register as tutor: ${error.message}`);
        }
    }

    async getTutorProfile(tutor_id) {
        try {
            const tutor = await tutorRepository.findById(tutor_id);
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            // Получаем отзывы для репетитора
            const reviews = await reviewRepository.findByTutor(tutor_id);

            // Получаем средний рейтинг
            const ratingStats = await reviewRepository.getTutorAverageRating(tutor_id);

            return {
                ...tutor.toJSON(),
                reviews,
                rating_stats: ratingStats
            };
        } catch (error) {
            throw new Error(`Failed to get tutor profile: ${error.message}`);
        }
    }

    async getAllTutors(filters = {}) {
        try {
            const tutors = await tutorRepository.findAll();

            // Применяем фильтры
            let filteredTutors = tutors;

            if (filters.subject_id) {
                filteredTutors = filteredTutors.filter(t => t.subject_id == filters.subject_id);
            }

            if (filters.min_experience) {
                filteredTutors = filteredTutors.filter(t => t.experience >= filters.min_experience);
            }

            if (filters.max_price) {
                filteredTutors = filteredTutors.filter(t => t.price_per_hour <= filters.max_price);
            }

            if (filters.min_rating) {
                filteredTutors = filteredTutors.filter(t => t.rating_avg >= filters.min_rating);
            }

            // Для каждого репетитора получаем дополнительную информацию
            const tutorsWithDetails = await Promise.all(
                filteredTutors.map(async (tutor) => {
                    const reviews = await reviewRepository.findByTutor(tutor.tutor_id);
                    const ratingStats = await reviewRepository.getTutorAverageRating(tutor.tutor_id);

                    return {
                        ...tutor.toJSON(),
                        reviews_count: reviews.length,
                        rating_stats: ratingStats
                    };
                })
            );

            // Сортировка
            if (filters.sort_by) {
                tutorsWithDetails.sort((a, b) => {
                    switch (filters.sort_by) {
                        case 'rating':
                            return b.rating_avg - a.rating_avg;
                        case 'price_low':
                            return a.price_per_hour - b.price_per_hour;
                        case 'price_high':
                            return b.price_per_hour - a.price_per_hour;
                        case 'experience':
                            return b.experience - a.experience;
                        default:
                            return 0;
                    }
                });
            }

            return tutorsWithDetails;
        } catch (error) {
            throw new Error(`Failed to get tutors: ${error.message}`);
        }
    }

    /**
     * Возвращает список репетиторов в плоском формате,
     * который ожидает каталог на фронтенде.
     */
    async getCatalogTutors() {
        try {
            const tutors = await tutorRepository.findAll();

            // Для каждого репетитора рассчитываем рейтинг из отзывов
            const tutorsWithRatings = await Promise.all(
                tutors.map(async (tutor) => {
                    // Получаем рейтинг из отзывов
                    const ratingStats = await reviewRepository.getTutorAverageRating(tutor.tutor_id);
                    const reviews = await reviewRepository.findByTutor(tutor.tutor_id);
                    
                    // Используем рейтинг из отзывов, если он есть, иначе из БД
                    const calculatedRating = ratingStats.avg_rating 
                        ? parseFloat(ratingStats.avg_rating) 
                        : (Number(tutor.rating_avg) || 0);

                    return {
                        user_id: tutor.tutor_id,
                        name: tutor.name,
                        email: tutor.email,
                        bio: tutor.bio || null,
                        subject_id: tutor.subject_id,
                        subject_name: tutor.subject_name,
                        experience: Number(tutor.experience) || 0,
                        price_per_hour: Number(tutor.price_per_hour) || 0,
                        rating_avg: calculatedRating,
                        review_count: reviews.length || 0
                    };
                })
            );

            return tutorsWithRatings;
        } catch (error) {
            throw new Error(`Failed to get catalog tutors: ${error.message}`);
        }
    }

    async updateTutorProfile(tutor_id, updateData) {
        try {
            const tutor = await tutorRepository.findById(tutor_id);
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            // Проверяем предмет если он меняется
            if (updateData.subject_id) {
                const subject = await subjectRepository.findById(updateData.subject_id);
                if (!subject) {
                    throw new Error('Subject not found');
                }
            }

            // Обновляем профиль
            // Здесь нужно создать метод update в репозитории
            // Пока возвращаем текущий профиль
            return tutor;
        } catch (error) {
            throw new Error(`Failed to update tutor profile: ${error.message}`);
        }
    }

    async updateTutorRating(tutor_id) {
        try {
            const ratingStats = await reviewRepository.getTutorAverageRating(tutor_id);
            if (ratingStats.avg_rating) {
                await tutorRepository.updateRating(tutor_id, parseFloat(ratingStats.avg_rating));
            }
            return ratingStats;
        } catch (error) {
            throw new Error(`Failed to update tutor rating: ${error.message}`);
        }
    }

    async getRecommendedTutors(student_id = null) {
        try {
            // Получаем всех репетиторов, отсортированных по рейтингу
            const allTutors = await tutorRepository.findAll();
            
            if (!allTutors || allTutors.length === 0) {
                return [];
            }
            
            // Берем топ-3 репетитора с лучшим рейтингом
            // Если рейтинг NULL или 0, все равно включаем репетитора
            const recommended = allTutors
                .filter(tutor => tutor && tutor.tutor_id) // Проверяем, что репетитор существует
                .sort((a, b) => {
                    const ratingA = parseFloat(a.rating_avg || 0);
                    const ratingB = parseFloat(b.rating_avg || 0);
                    return ratingB - ratingA;
                })
                .slice(0, 3);

            // Форматируем для фронтенда
            return recommended.map(tutor => ({
                id: tutor.tutor_id,
                name: tutor.name || 'Не указано',
                subject: tutor.subject_name || 'Не указан',
                rating: parseFloat(tutor.rating_avg || 0).toFixed(1),
                price: parseFloat(tutor.price_per_hour || 0),
                experience: tutor.experience || 0
            }));
        } catch (error) {
            console.error('Error in getRecommendedTutors:', error);
            throw new Error(`Failed to get recommended tutors: ${error.message}`);
        }
    }

    async getTutorSchedule(tutor_id) {
        try {
            // Получаем все уроки репетитора
            const lessons = await lessonRepository.findByTutor(tutor_id);

            // Получаем pending запросы на уроки
            const pendingRequests = await lessonRequestRepository.findByTutor(tutor_id);

            // Получаем заблокированные слоты из расписания
            const blockedSlots = await tutorScheduleRepository.findByTutor(tutor_id);

            // Форматируем уроки в формат расписания
            const scheduleItems = [];

            // Добавляем запланированные и завершенные уроки
            lessons.forEach(lesson => {
                // Форматируем дату
                let lessonDate;
                if (lesson.lesson_date instanceof Date) {
                    lessonDate = lesson.lesson_date.toISOString().split('T')[0];
                } else if (typeof lesson.lesson_date === 'string') {
                    // Если это строка, берем только дату (YYYY-MM-DD)
                    lessonDate = lesson.lesson_date.split('T')[0].split(' ')[0];
                } else {
                    lessonDate = '';
                }

                // Форматируем время
                let startTime;
                if (lesson.start_time instanceof Date) {
                    startTime = lesson.start_time.toTimeString().split(' ')[0].substring(0, 5);
                } else if (typeof lesson.start_time === 'string') {
                    // Если это строка TIME из PostgreSQL (HH:MM:SS), берем только HH:MM
                    startTime = lesson.start_time.substring(0, 5);
                } else {
                    startTime = '00:00';
                }

                // Вычисляем длительность в минутах
                let duration = 60; // по умолчанию 1 час
                if (lesson.start_time && lesson.end_time) {
                    try {
                        const startTimeStr = typeof lesson.start_time === 'string'
                            ? lesson.start_time.substring(0, 5)
                            : lesson.start_time.toTimeString().split(' ')[0].substring(0, 5);
                        const endTimeStr = typeof lesson.end_time === 'string'
                            ? lesson.end_time.substring(0, 5)
                            : lesson.end_time.toTimeString().split(' ')[0].substring(0, 5);

                        const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
                        const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
                        duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
                        if (duration <= 0) duration = 60; // fallback
                    } catch (e) {
                        duration = 60; // fallback при ошибке
                    }
                }

                scheduleItems.push({
                    schedule_id: lesson.lesson_id,
                    id: lesson.lesson_id,
                    date: lessonDate,
                    time: startTime,
                    status: 'booked', // Все уроки (завершенные и запланированные) показываются как занятые
                    student_name: lesson.student_name || null,
                    subject_name: lesson.subject_name || null,
                    duration: duration,
                    is_recurring: false,
                    lesson_id: lesson.lesson_id
                });
            });

            // КОММЕНТАРИЙ: Pending запросы временно не добавляем в расписание
            // Можно раскомментировать этот блок, когда нужно будет показывать pending запросы

            /*
            pendingRequests.forEach(request => {
                if (request.status === 'pending' && request.scheduled_time) {
                    let requestDate, requestTime;

                    try {
                        // Обрабатываем scheduled_time (может быть Date или строка)
                        let scheduledTime;
                        if (request.scheduled_time instanceof Date) {
                            scheduledTime = request.scheduled_time;
                        } else if (typeof request.scheduled_time === 'string') {
                            scheduledTime = new Date(request.scheduled_time);
                        } else {
                            return; // Пропускаем, если не можем распарсить
                        }

                        // Проверяем, что дата валидна
                        if (isNaN(scheduledTime.getTime())) {
                            return; // Пропускаем невалидные даты
                        }

                        requestDate = scheduledTime.toISOString().split('T')[0];
                        requestTime = scheduledTime.toTimeString().split(' ')[0].substring(0, 5);
                    } catch (e) {
                        console.error('Error parsing scheduled_time:', e);
                        return; // Пропускаем при ошибке парсинга
                    }

                    scheduleItems.push({
                        schedule_id: `request_${request.request_id}`,
                        id: `request_${request.request_id}`,
                        date: requestDate,
                        time: requestTime,
                        status: 'pending', // Показываем отдельным статусом
                        student_name: request.student_name || null,
                        subject_name: request.subject_name || null,
                        duration: 60,
                        is_recurring: false,
                        lesson_id: null,
                        request_id: request.request_id
                    });
                }
            });
            */

            // Добавляем заблокированные слоты из таблицы расписания
            // Создаем мапу для быстрой проверки существующих слотов
            const existingSlotsMap = new Map();
            scheduleItems.forEach(item => {
                const key = `${item.date}-${item.time}`;
                existingSlotsMap.set(key, item);
            });

            blockedSlots.forEach(slot => {
                const slotDate = slot.schedule_date instanceof Date
                    ? (() => {
                        const dateObj = slot.schedule_date;
                        return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
                    })()
                    : typeof slot.schedule_date === 'string'
                        ? slot.schedule_date.split('T')[0].split(' ')[0]
                        : '';

                const slotTime = slot.start_time instanceof Date
                    ? slot.start_time.toTimeString().split(' ')[0].substring(0, 5)
                    : typeof slot.start_time === 'string'
                        ? slot.start_time.substring(0, 5)
                        : '00:00';

                const slotKey = `${slotDate}-${slotTime}`;

                // Если уже есть урок или запрос на это время, не добавляем заблокированный слот
                // (урок имеет приоритет)
                if (existingSlotsMap.has(slotKey)) {
                    const existingSlot = existingSlotsMap.get(slotKey);
                    // Если существующий слот - это заблокированный, обновляем его статус
                    if (existingSlot.status === 'available' && slot.status === 'blocked') {
                        existingSlot.status = 'blocked';
                        existingSlot.schedule_id = slot.schedule_id;
                    }
                    return; // Пропускаем, если уже есть занятие
                }

                // Вычисляем длительность
                let duration = 60;
                if (slot.start_time && slot.end_time) {
                    try {
                        const startTimeStr = typeof slot.start_time === 'string'
                            ? slot.start_time.substring(0, 5)
                            : slot.start_time.toTimeString().split(' ')[0].substring(0, 5);
                        const endTimeStr = typeof slot.end_time === 'string'
                            ? slot.end_time.substring(0, 5)
                            : slot.end_time.toTimeString().split(' ')[0].substring(0, 5);

                        const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
                        const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
                        duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
                        if (duration <= 0) duration = 60;
                    } catch (e) {
                        duration = 60;
                    }
                }

                scheduleItems.push({
                    schedule_id: slot.schedule_id,
                    id: slot.schedule_id,
                    date: slotDate,
                    time: slotTime,
                    status: slot.status === 'blocked' ? 'blocked' : 'available',
                    student_name: null,
                    subject_name: null,
                    duration: duration,
                    is_recurring: slot.is_recurring || false,
                    lesson_id: null
                });
            });

            return scheduleItems;
        } catch (error) {
            console.error('Error in getTutorSchedule:', error);
            throw new Error(`Failed to get tutor schedule: ${error.message}`);
        }
    }



    async blockTimeSlots(scheduleItems) {
        try {
            // Используем метод для создания нескольких слотов
            const blockedSlots = await tutorScheduleRepository.createMultiple(scheduleItems);
            return blockedSlots.map(slot => slot.toJSON());
        } catch (error) {
            console.error('Error blocking time slots:', error);
            throw new Error(`Failed to block time slots: ${error.message}`);
        }
    }

    async getTutorStudents(tutor_id) {
        try {
            // Получаем все уроки репетитора
            const lessons = await lessonRepository.findByTutor(tutor_id);
            
            // Создаем мапу студентов с их статистикой
            const studentsMap = new Map();
            
            lessons.forEach(lesson => {
                const studentId = lesson.student_id;
                const studentData = lesson;
                
                if (!studentsMap.has(studentId)) {
                    studentsMap.set(studentId, {
                        student_id: studentId,
                        student_name: studentData.student_name,
                        student_email: studentData.student_email,
                        subject_name: studentData.subject_name,
                        totalLessons: 0,
                        completedLessons: 0,
                        nextLesson: null,
                        firstLessonDate: null
                    });
                }
                
                const student = studentsMap.get(studentId);
                student.totalLessons++;
                
                if (lesson.is_completed) {
                    student.completedLessons++;
                }
                
                // Находим ближайший предстоящий урок
                if (!lesson.is_completed && lesson.lesson_date) {
                    const lessonDate = new Date(lesson.lesson_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (lessonDate >= today) {
                        if (!student.nextLesson || new Date(student.nextLesson.date) > lessonDate) {
                            student.nextLesson = {
                                date: lesson.lesson_date,
                                time: lesson.start_time ? lesson.start_time.substring(0, 5) : '00:00'
                            };
                        }
                    }
                }
                
                // Находим дату первого урока
                if (lesson.lesson_date) {
                    const lessonDate = lesson.lesson_date instanceof Date 
                        ? lesson.lesson_date 
                        : new Date(lesson.lesson_date);
                    
                    if (!student.firstLessonDate || lessonDate < new Date(student.firstLessonDate)) {
                        student.firstLessonDate = lesson.lesson_date;
                    }
                }
            });
            
            // Преобразуем в массив и вычисляем прогресс
            const students = Array.from(studentsMap.values()).map(student => {
                const progress = student.totalLessons > 0 
                    ? Math.round((student.completedLessons / student.totalLessons) * 100)
                    : 0;
                
                return {
                    id: student.student_id,
                    name: student.student_name,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.student_name || 'Студент')}&background=random`,
                    subject: student.subject_name || 'Не указан',
                    totalLessons: student.totalLessons,
                    completedLessons: student.completedLessons,
                    rating: 5, // Можно вычислить из отзывов
                    progress: progress,
                    joinedDate: student.firstLessonDate || new Date().toISOString().split('T')[0],
                    nextLesson: student.nextLesson
                };
            });
            
            return students;
        } catch (error) {
            console.error('Error getting tutor students:', error);
            throw new Error(`Failed to get tutor students: ${error.message}`);
        }
    }
}

module.exports = new TutorService();