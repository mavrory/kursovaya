import { Calendar, Clock, User, DollarSign, Video, MessageSquare, Star, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useMemo, useState, useEffect } from 'react';

export function LessonCard({ lesson, viewType = 'student', onAction, onRate, occupiedSlots = [] }) {
    const [showRatingForm, setShowRatingForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleComment, setRescheduleComment] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Определяем наличие pending запроса на перенос
    const pendingChangeRequest = useMemo(() => {
        // Проверяем разные возможные варианты хранения pending запроса
        if (lesson.pending_change_request && lesson.pending_change_request.status === 'pending') {
            return lesson.pending_change_request;
        }

        if (lesson.change_requests && Array.isArray(lesson.change_requests)) {
            return lesson.change_requests.find(req => req.status === 'pending') || null;
        }

        // Проверяем поля, которые могли прийти с бэкенда
        if (lesson.proposed_date && lesson.proposed_time && lesson.change_status === 'pending') {
            return {
                proposed_date: lesson.proposed_date,
                proposed_time: lesson.proposed_time,
                comment: lesson.change_comment,
                status: 'pending',
                requester_id: lesson.change_requester_id
            };
        }

        return null;
    }, [lesson]);

    const hasPendingChangeRequest = !!pendingChangeRequest;

    const getStatusColor = (status, hasPendingRequest) => {
        if (hasPendingRequest) {
            return 'bg-orange-100 text-orange-700 border-orange-200';
        }

        switch (status) {
            case 'scheduled':
                return 'bg-accent-100 text-accent-700 border-accent-200';
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    const getStatusLabel = (status, hasPendingRequest) => {
        if (hasPendingRequest) {
            return 'Ожидает подтверждения переноса';
        }

        switch (status) {
            case 'scheduled':
                return 'Запланирован';
            case 'completed':
                return 'Завершен';
            case 'cancelled':
                return 'Отменен';
            case 'pending':
                return 'Ожидает подтверждения';
            default:
                return status;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return { date: 'Не указана', time: 'Не указано', fullDate: new Date() };

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { date: 'Не указана', time: 'Не указано', fullDate: new Date() };
        }

        return {
            date: date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            fullDate: date
        };
    };

    // Форматируем предложенную дату из pending запроса
    const getProposedDateTime = () => {
        if (!pendingChangeRequest || !pendingChangeRequest.proposed_date || !pendingChangeRequest.proposed_time) {
            return null;
        }

        try {
            const dateStr = `${pendingChangeRequest.proposed_date}T${pendingChangeRequest.proposed_time}`;
            const date = new Date(dateStr);

            if (isNaN(date.getTime())) {
                return null;
            }

            return {
                date: date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                time: date.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                fullDate: date
            };
        } catch (error) {
            console.error('Error formatting proposed date:', error);
            return null;
        }
    };

    // Определяем, является ли текущий пользователь инициатором запроса
    const isRequester = useMemo(() => {
        if (!pendingChangeRequest || !pendingChangeRequest.requester_id) return false;

        // Получаем ID текущего пользователя из localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const currentUserId = user.user_id || user.id;
        
        return pendingChangeRequest.requester_id === currentUserId;
    }, [pendingChangeRequest]);

    // Определяем, является ли текущий пользователь ответчиком
    // ИСПОЛЬЗУЕМ is_responder из pending_change_request, который приходит с бэкенда
    const isResponder = useMemo(() => {
        if (!pendingChangeRequest) return false;
        
        // Если is_responder уже пришел с бэкенда, используем его
        if (typeof pendingChangeRequest.is_responder === 'boolean') {
            return pendingChangeRequest.is_responder;
        }
        
        // Fallback: определяем вручную, если is_responder не пришел
        if (!lesson) return false;
        
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const currentUserId = user.user_id || user.id;
        const isLessonParticipant = currentUserId === lesson.student_id || currentUserId === lesson.tutor_id;

        // Ответчик - это участник урока, который НЕ является инициатором
        return isLessonParticipant && !isRequester;
    }, [pendingChangeRequest, lesson, isRequester]);

    // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---

    const handleCancel = () => {
        if (window.confirm('Вы уверены, что хотите отменить урок?')) {
            const lessonId = lesson.id || lesson.lesson_id;
            console.log('Отмена урока:', lessonId);
            onAction?.(lessonId, 'cancel');
        }
    };

    const handleReschedule = () => {
        setShowRatingForm(false);
        setShowRescheduleForm(true);

        // Устанавливаем текущую дату и время урока как значения по умолчанию
        const lessonDate = new Date(lesson.scheduledFor || lesson.lesson_date);

        if (!isNaN(lessonDate.getTime())) {
            const defaultDate = lessonDate.toISOString().split('T')[0];
            const defaultTime = lessonDate.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            }).substring(0, 5);

            setRescheduleDate(defaultDate);
            setRescheduleTime(defaultTime);
        } else {
            // Если дата невалидна, устанавливаем завтрашний день
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setRescheduleDate(tomorrow.toISOString().split('T')[0]);
            setRescheduleTime('10:00');
        }

        setRescheduleComment('');
    };

    const handleRescheduleSubmit = () => {
        if (!rescheduleDate || !rescheduleTime) {
            alert('Пожалуйста, выберите дату и время для переноса');
            return;
        }

        // Проверка конфликтов в расписании
        const conflictSlot = occupiedSlots.find(slot =>
            slot.date === rescheduleDate && slot.time.substring(0, 5) === rescheduleTime
        );

        if (conflictSlot) {
            let statusText = 'занят';
            if (conflictSlot.status === 'booked') {
                statusText = 'уже забронирован';
            } else if (conflictSlot.status === 'blocked') {
                statusText = 'заблокирован в расписании';
            }

            alert(`Ошибка переноса: Время ${rescheduleTime} на ${rescheduleDate} ${statusText}. Пожалуйста, выберите другое время.`);
            return;
        }

        // Отправка запроса на перенос
        const lessonId = lesson.id || lesson.lesson_id;
        console.log('Отправка запроса на перенос:', lessonId);
        onAction?.(lessonId, 'reschedule', {
            lesson_id: lessonId,
            proposed_date: rescheduleDate,
            proposed_time: rescheduleTime,
            comment: rescheduleComment
        });

        setShowRescheduleForm(false);
    };

    const handleAcceptReschedule = () => {
        if (window.confirm('Вы уверены, что хотите подтвердить перенос урока?')) {
            const lessonId = lesson.id || lesson.lesson_id;
            console.log('Принятие переноса:', lessonId);
            onAction?.(lessonId, 'accept_reschedule');
        }
    };

    const handleRejectReschedule = () => {
        if (window.confirm('Вы уверены, что хотите отклонить запрос на перенос урока?')) {
            const lessonId = lesson.id || lesson.lesson_id;
            console.log('Отклонение переноса:', lessonId);
            onAction?.(lessonId, 'reject_reschedule');
        }
    };

    const handleAcceptRequest = () => {
        const lessonId = lesson.id || lesson.lesson_id;
        console.log('Принятие запроса на урок:', lessonId);
        onAction?.(lessonId, 'accept');
    };

    const handleRejectRequest = () => {
        if (window.confirm('Вы уверены, что хотите отклонить запрос на урок?')) {
            const lessonId = lesson.id || lesson.lesson_id;
            console.log('Отклонение запроса на урок:', lessonId);
            onAction?.(lessonId, 'reject');
        }
    };

    const handleJoin = () => {
        if (lesson.meeting_link || lesson.meetingLink) {
            window.open(lesson.meeting_link || lesson.meetingLink, '_blank');
        } else {
            alert('Ссылка на урок не указана');
        }
    };

    const handleRate = () => {
        if (rating > 0) {
            onRate?.(lesson.id, rating, review);
            setShowRatingForm(false);
            setRating(0);
            setReview('');
        }
    };

    const handleCancelReschedule = () => {
        if (window.confirm('Вы уверены, что хотите отменить запрос на перенос?')) {
            const lessonId = lesson.id || lesson.lesson_id;
            console.log('Отмена запроса на перенос:', lessonId);
            onAction?.(lessonId, 'cancel_reschedule');
        }
    };

    // --- ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ---

    const { date, time, fullDate } = formatDateTime(lesson.scheduledFor || lesson.lesson_date);
    const proposedDateTime = getProposedDateTime();

    const isUpcoming = useMemo(() => {
        const status = lesson.status || 'scheduled';
        return status === 'scheduled' && fullDate.getTime() > currentTime;
    }, [lesson.status, fullDate, currentTime]);

    const canJoin = useMemo(() => {
        return isUpcoming &&
            fullDate.getTime() - currentTime < 30 * 60 * 1000; // Можно присоединиться за 30 минут до начала
    }, [isUpcoming, fullDate, currentTime]);

    // --- РЕНДЕРИНГ ---

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-primary-100 hover:shadow-lg transition-all">
            {/* ШАПКА КАРТОЧКИ */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        {/* Аватар */}
                        {viewType === 'student' && (lesson.tutor?.avatar || lesson.tutor_avatar) && (
                            <img
                                src={lesson.tutor.avatar || lesson.tutor_avatar}
                                alt={lesson.tutor?.name || lesson.tutor_name || 'Репетитор'}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}
                        {viewType === 'tutor' && (lesson.student?.avatar || lesson.student_avatar) && (
                            <img
                                src={lesson.student.avatar || lesson.student_avatar}
                                alt={lesson.student?.name || lesson.student_name || 'Ученик'}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}

                        {/* Информация о пользователе */}
                        <div>
                            <h4 className="text-neutral-900 font-medium mb-1">
                                {lesson.subject?.name || lesson.subject_name || lesson.subject || 'Предмет'}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <User className="w-4 h-4" />
                                <span>
                                    {viewType === 'student'
                                        ? lesson.tutor?.name || lesson.tutor_name || 'Репетитор'
                                        : lesson.student?.name || lesson.student_name || 'Ученик'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Бэйджик статуса */}
                <Badge className={`${getStatusColor(lesson.status, hasPendingChangeRequest)} whitespace-nowrap`}>
                    {getStatusLabel(lesson.status, hasPendingChangeRequest)}
                </Badge>
            </div>

            {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <div className="space-y-3 mb-4">
                {/* БЛОК ПЕНДИНГ ЗАПРОСА НА ПЕРЕНОС */}
                {hasPendingChangeRequest && proposedDateTime && (
                    <div className="bg-orange-50 border border-orange-300 p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <p className="text-sm font-semibold text-orange-800">
                                Запрос на перенос урока
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-500" />
                                    <span className="font-medium">Предложено:</span>
                                    <span className="text-orange-700">
                                        {proposedDateTime.date} в {proposedDateTime.time}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-neutral-500" />
                                    <span className="text-neutral-600">
                                        (Текущее: {date} в {time})
                                    </span>
                                </div>
                            </div>

                            {pendingChangeRequest.comment && (
                                <p className="text-xs text-neutral-700 mt-2 bg-orange-100 p-2 rounded">
                                    <span className="font-medium">Комментарий: </span>
                                    "{pendingChangeRequest.comment}"
                                </p>
                            )}

                            {/* Информация о том, кто инициатор */}
                            <div className="text-xs text-neutral-600 mt-2">
                                {isRequester ? (
                                    <span className="text-blue-600">Вы отправили запрос на перенос</span>
                                ) : isResponder ? (
                                    <span className="text-orange-600">Вам предложили перенос</span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {/* ОСНОВНАЯ ИНФОРМАЦИЯ ОБ УРОКЕ */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Clock className="w-4 h-4" />
                        <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration || 60} мин</span>
                    </div>
                    {lesson.price_per_hour && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{lesson.price_per_hour} руб/час</span>
                        </div>
                    )}
                </div>

                {/* ОПИСАНИЕ */}
                {lesson.description && (
                    <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
                        {lesson.description}
                    </p>
                )}

                {/* ССЫЛКА НА УРОК */}
                {(lesson.meeting_link || lesson.meetingLink) && (
                    <div className="flex items-center gap-2 text-sm text-primary-600">
                        <Video className="w-4 h-4" />
                        <span>Онлайн-урок</span>
                        <a
                            href={lesson.meeting_link || lesson.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                        >
                            Перейти к уроку
                        </a>
                    </div>
                )}

                {/* ОТЗЫВ О ЗАВЕРШЕННОМ УРОКЕ */}
                {lesson.status === 'completed' && (
                    <div className="pt-3 border-t border-neutral-200">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                                Оценка: {lesson.rating ? `${lesson.rating}/5` : 'еще нет'}
                            </span>
                        </div>
                        {lesson.review && (
                            <div className="mt-2 flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-neutral-400 mt-1" />
                                <p className="text-sm text-neutral-600 italic">"{lesson.review}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* КНОПКИ ДЕЙСТВИЙ */}
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {/* 1. КНОПКИ ДЛЯ ПЕНДИНГ ЗАПРОСА НА ПЕРЕНОС */}
                    {hasPendingChangeRequest && (
                        <>
                            {isResponder ? (
                                // Ответчик видит кнопки подтвердить/отклонить
                                <>
                                    <Button
                                        size="sm"
                                        onClick={handleAcceptReschedule}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        Подтвердить перенос
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRejectReschedule}
                                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        Отклонить перенос
                                    </Button>
                                </>
                            ) : isRequester ? (
                                // Инициатор видит кнопку отмены своего запроса
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelReschedule}
                                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                                >
                                    Отменить запрос на перенос
                                </Button>
                            ) : (
                                // Ожидание ответа от другого участника
                                <div className="w-full text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-800">
                                        Ожидается ответ от {viewType === 'tutor' ? 'ученика' : 'репетитора'}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* 2. КНОПКИ ДЛЯ ЗАПЛАНИРОВАННОГО УРОКА (если нет pending запроса) */}
                    {lesson.status === 'scheduled' && !hasPendingChangeRequest && (
                        <>
                            {canJoin && (
                                <Button
                                    size="sm"
                                    onClick={handleJoin}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Присоединиться
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleReschedule}
                                className="flex-1 border-primary-300 text-primary-600 hover:bg-primary-50"
                            >
                                Перенести
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                                Отменить
                            </Button>
                        </>
                    )}

                    {/* 3. КНОПКИ ДЛЯ ОЖИДАЮЩЕГО ПОДТВЕРЖДЕНИЯ УРОКА (только для репетитора) */}
                    {lesson.status === 'pending' && viewType === 'tutor' && !hasPendingChangeRequest && (
                        <>
                            <Button
                                size="sm"
                                onClick={handleAcceptRequest}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                                Принять урок
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRejectRequest}
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                                Отклонить урок
                            </Button>
                        </>
                    )}
                </div>

                {/* ФОРМА ПЕРЕНОСА УРОКА */}
                {showRescheduleForm && lesson.status === 'scheduled' && !hasPendingChangeRequest && (
                    <div className="w-full p-4 bg-white border border-primary-200 rounded-lg space-y-3">
                        <h4 className="text-sm font-medium text-neutral-900">Перенос урока</h4>

                        <div>
                            <label className="block text-xs text-neutral-700 mb-1">Новая дата</label>
                            <input
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-neutral-700 mb-1">Новое время</label>
                            <input
                                type="time"
                                value={rescheduleTime}
                                onChange={(e) => setRescheduleTime(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-neutral-700 mb-1">Комментарий (необязательно)</label>
                            <textarea
                                value={rescheduleComment}
                                onChange={(e) => setRescheduleComment(e.target.value)}
                                placeholder="Причина переноса..."
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows="2"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleRescheduleSubmit}
                                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                                disabled={!rescheduleDate || !rescheduleTime}
                            >
                                Отправить запрос
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setShowRescheduleForm(false);
                                    setRescheduleDate('');
                                    setRescheduleTime('');
                                    setRescheduleComment('');
                                }}
                                className="flex-1"
                            >
                                Отмена
                            </Button>
                        </div>
                    </div>
                )}

                {/* ФОРМА ОЦЕНКИ ДЛЯ СТУДЕНТА */}
                {lesson.status === 'completed' && viewType === 'student' && !lesson.rating && !hasPendingChangeRequest && (
                    <>
                        {!showRatingForm ? (
                            <Button
                                size="sm"
                                onClick={() => setShowRatingForm(true)}
                                className="w-full bg-secondary-500 hover:bg-secondary-600 text-white"
                            >
                                <Star className="w-4 h-4 mr-2" />
                                Оставить отзыв
                            </Button>
                        ) : (
                            <div className="w-full space-y-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`text-2xl transition-colors ${star <= rating ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-gray-400'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Ваш отзыв о уроке..."
                                    className="w-full text-sm p-3 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows="3"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleRate}
                                        disabled={rating === 0}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        Отправить отзыв
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowRatingForm(false)}
                                        className="flex-1"
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ИНФОРМАЦИЯ О ЗАВЕРШЕННОМ УРОКЕ ДЛЯ РЕПЕТИТОРА */}
                {lesson.status === 'completed' && viewType === 'tutor' && !hasPendingChangeRequest && (
                    <div className="w-full text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600">
                            Урок завершен {lesson.completed_at ? new Date(lesson.completed_at).toLocaleDateString('ru-RU') : date}
                        </p>
                    </div>
                )}

                {/* ИНФОРМАЦИЯ ОБ ОТМЕНЕННОМ УРОКЕ */}
                {lesson.status === 'cancelled' && !hasPendingChangeRequest && (
                    <div className="w-full text-center p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-red-600">
                            Урок отменен {lesson.cancelled_reason ? `(Причина: ${lesson.cancelled_reason})` : ''}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
