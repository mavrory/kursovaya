import { useEffect, useState } from 'react';
import { Calendar, Users, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';

export function TutorDashboard() {
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [occupiedSlots, setOccupiedSlots] = useState([]);
    const [stats, setStats] = useState({
        upcomingCount: 0,
        activeStudents: 0,
        averageRating: 0,
        reviewsCount: 0,
        monthlyEarnings: 0
    });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState('');

    const API_URL = "http://localhost:5000/api";

    const formatLesson = (lesson) => {
        try {
            let safeDate;
            if (lesson.scheduled_for || lesson.lesson_date) {
                const dateStr = lesson.scheduled_for ||
                    (lesson.lesson_date && lesson.start_time
                        ? `${lesson.lesson_date}T${lesson.start_time}`
                        : null);

                if (dateStr) {
                    const parsedDate = new Date(dateStr);
                    safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
                } else {
                    safeDate = new Date();
                }
            } else {
                safeDate = new Date();
            }

            const formatted = {
                id: lesson.lesson_id || lesson.request_id || lesson.id,
                lesson_id: lesson.lesson_id || lesson.id,
                request_id: lesson.request_id,
                subject: lesson.subject_name || lesson.subject,
                student: {
                    id: lesson.student_id,
                    name: lesson.student_name || 'Ученик',
                    avatar: lesson.student_avatar
                },
                tutor: {
                    id: lesson.tutor_id,
                    name: lesson.tutor_name || 'Репетитор',
                    avatar: lesson.tutor_avatar
                },
                scheduledFor: safeDate,
                lesson_date: lesson.lesson_date,
                start_time: lesson.start_time,
                duration: lesson.duration || 60,
                price: lesson.price_per_hour || lesson.price || 0,
                status: lesson.status || lesson.request_status || 'scheduled',
                description: lesson.description,
                meetingLink: lesson.meeting_link || lesson.meetingLink,
                // Данные о pending запросе на перенос
                pending_change_request: lesson.pending_change_request,
                change_requests: lesson.change_requests,
                proposed_date: lesson.proposed_date,
                proposed_time: lesson.proposed_time,
                change_status: lesson.change_status,
                change_comment: lesson.change_comment,
                change_requester_id: lesson.requester_id,
                // Для обратной совместимости
                ...lesson
            };

            // Добавляем is_responder для LessonCard
            if (lesson.pending_change_request) {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                const currentUserId = user.user_id || user.id;

                formatted.pending_change_request.is_responder =
                    lesson.pending_change_request.responder_id === currentUserId ||
                    lesson.responder_id === currentUserId;
            }

            return formatted;
        } catch (error) {
            console.error('Ошибка форматирования урока:', error, lesson);
            return {
                id: lesson.lesson_id || Date.now(),
                subject: lesson.subject_name || 'Ошибка загрузки',
                student: { id: 0, name: 'Ученик' },
                tutor: { id: 0, name: 'Репетитор' },
                scheduledFor: new Date(),
                duration: 60,
                price: 0,
                status: 'scheduled'
            };
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Токен не найден. Пожалуйста, войдите заново.');
                }

                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                setUserName(user.name || 'Репетитор');

                const [lessonsRes, requestsRes, statsRes, notificationsRes, scheduleRes] = await Promise.all([
                    fetch(`${API_URL}/lessons/tutor/upcoming`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    }),
                    fetch(`${API_URL}/lessons/tutor/pending-requests`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    }),
                    fetch(`${API_URL}/dashboard/tutor/stats`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    }),
                    fetch(`${API_URL}/tutor/notifications`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    }),
                    fetch(`${API_URL}/tutors/schedule`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    })
                ]);

                const errorResponses = [];
                if (!lessonsRes.ok) errorResponses.push('Предстоящие уроки');
                if (!statsRes.ok) errorResponses.push('Статистика');
                if (!scheduleRes.ok) errorResponses.push('Расписание');

                const requestsData = requestsRes.ok ? await requestsRes.json() : [];
                const notificationsData = notificationsRes.ok ? await notificationsRes.json() : [];

                if (errorResponses.length > 0) {
                    throw new Error(`Ошибка загрузки: ${errorResponses.join(', ')}`);
                }

                const [lessonsData, statsData, scheduleData] = await Promise.all([
                    lessonsRes.json(),
                    statsRes.json(),
                    scheduleRes.json()
                ]);

                const formattedLessons = Array.isArray(lessonsData) ? lessonsData.map(formatLesson) : [];
                const formattedRequests = Array.isArray(requestsData) ? requestsData.map(formatLesson) : [];

                const occupied = Array.isArray(scheduleData)
                    ? scheduleData.filter(s => s.status === 'booked' || s.status === 'blocked').map(s => ({
                        date: s.date,
                        time: s.time,
                        status: s.status,
                    }))
                    : [];

                setUpcomingLessons(formattedLessons);
                setPendingRequests(formattedRequests);
                setStats(statsData);
                setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
                setOccupiedSlots(occupied);

            } catch (err) {
                console.error('Ошибка загрузки дашборда репетитора:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);




    const handleLessonAction = async (lessonId, action, data = {}) => {
        console.log('🚀 handleLessonAction called:', { lessonId, action, data });

        // ВАЛИДАЦИЯ ПАРАМЕТРОВ
        if (typeof lessonId !== 'number' && typeof lessonId !== 'string') {
            console.error('❌ Invalid lessonId type:', typeof lessonId, lessonId);
            alert('Ошибка: Неверный ID урока');
            return;
        }

        if (typeof action !== 'string') {
            console.error('❌ Invalid action type:', typeof action, action);
            alert('Ошибка: Неверный тип действия');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Токен не найден');
            }

            let url;
            let method = 'POST';
            let bodyData = null;
            let isChangeRequest = false;

            // ОПРЕДЕЛЯЕМ ТИП ДЕЙСТВИЯ И URL
            switch (action) {
                // 1. ОТМЕНА УРОКА
                case 'cancel':
                    url = `${API_URL}/lessons/${lessonId}/cancel`;
                    break;

                // 2. СОЗДАНИЕ ЗАПРОСА НА ПЕРЕНОС
                case 'reschedule':
                    url = `${API_URL}/change-requests`;
                    bodyData = JSON.stringify({
                        lesson_id: parseInt(lessonId),
                        proposed_date: data.proposed_date,
                        proposed_time: data.proposed_time,
                        comment: data.comment || ''
                    });
                    isChangeRequest = true;
                    break;

                // 3. ПРИНЯТИЕ ПЕРЕНОСА
                case 'accept_reschedule':
                    url = `${API_URL}/change-requests/lesson/${lessonId}/process`;
                    method = 'PUT';
                    bodyData = JSON.stringify({ action: 'accept' });
                    isChangeRequest = true;
                    break;

                // 4. ОТКЛОНЕНИЕ ПЕРЕНОСА
                case 'reject_reschedule':
                    url = `${API_URL}/change-requests/lesson/${lessonId}/process`;
                    method = 'PUT';
                    bodyData = JSON.stringify({ action: 'reject' });
                    isChangeRequest = true;
                    break;

                // 5. ПРИНЯТИЕ НОВОГО ЗАПРОСА НА УРОК
                case 'accept':
                    url = `${API_URL}/lessons/${lessonId}/accept`;
                    break;

                // 6. ОТКЛОНЕНИЕ НОВОГО ЗАПРОСА НА УРОК
                case 'reject':
                    url = `${API_URL}/lessons/${lessonId}/reject`;
                    break;

                default:
                    throw new Error(`Неизвестное действие: ${action}`);
            }

            console.log('📡 Making request:', { url, method, body: bodyData });

            // ОТПРАВКА ЗАПРОСА
            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: bodyData
            });

            // ОБРАБОТКА ОТВЕТА
            if (!res.ok) {
                let errorMessage = `Ошибка ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = await res.text();
                }
                throw new Error(errorMessage);
            }

            const result = await res.json();
            console.log('✅ Response:', result);

            // ОБНОВЛЕНИЕ UI
            // Убираем урок из pendingRequests если это был запрос
            if (action === 'accept' || action === 'reject') {
                const updatedRequests = pendingRequests.filter(lesson =>
                    lesson.id !== lessonId && lesson.lesson_id !== lessonId
                );
                setPendingRequests(updatedRequests);

                // Если приняли урок, добавляем его в upcoming
                if (action === 'accept') {
                    const acceptedLesson = pendingRequests.find(lesson =>
                        lesson.id === lessonId || lesson.lesson_id === lessonId
                    );
                    if (acceptedLesson) {
                        setUpcomingLessons(prev => [...prev, {
                            ...acceptedLesson,
                            status: 'scheduled'
                        }]);
                    }
                }
            }

            // Для действий с переносом обновляем данные
            if (isChangeRequest) {
                // Перезагружаем данные дашборда
                const fetchData = async () => {
                    try {
                        const [lessonsRes, requestsRes] = await Promise.all([
                            fetch(`${API_URL}/lessons/tutor/upcoming`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }),
                            fetch(`${API_URL}/lessons/tutor/pending-requests`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            })
                        ]);

                        if (lessonsRes.ok) {
                            const lessonsData = await lessonsRes.json();
                            const formattedLessons = Array.isArray(lessonsData)
                                ? lessonsData.map(formatLesson)
                                : [];
                            setUpcomingLessons(formattedLessons);
                        }

                        if (requestsRes.ok) {
                            const requestsData = await requestsRes.json();
                            const formattedRequests = Array.isArray(requestsData)
                                ? requestsData.map(formatLesson)
                                : [];
                            setPendingRequests(formattedRequests);
                        }
                    } catch (err) {
                        console.error('Ошибка обновления данных:', err);
                    }
                };

                fetchData();
            }

            // СООБЩЕНИЯ ОБ УСПЕХЕ
            const actionMessages = {
                'accept': 'Запрос на урок принят',
                'reject': 'Запрос на урок отклонен',
                'cancel': 'Урок успешно отменен',
                'reschedule': 'Запрос на перенос успешно отправлен',
                'accept_reschedule': 'Перенос урока подтвержден',
                'reject_reschedule': 'Перенос урока отклонен'
            };

            if (actionMessages[action]) {
                alert(`✅ ${actionMessages[action]}`);
            }

            return result;

        } catch (err) {
            console.error('❌ Ошибка выполнения действия:', err);
            alert(`❌ Ошибка: ${err.message}`);
            throw err;
        }
    };




    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем данные...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 mb-2 font-medium">Ошибка загрузки</p>
                <p className="text-sm text-neutral-600 mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Попробовать снова
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/';
                        }}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                        Выйти
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-neutral-900 mb-2">Добро пожаловать, {userName}! 👋</h1>
                        <p className="text-neutral-600">Твой кабинет репетитора</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-primary-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-8 h-8 text-primary-500" />
                        <span className="text-2xl text-neutral-900">{stats.upcomingCount || 0}</span>
                    </div>
                    <p className="text-sm text-neutral-600">Предстоящих уроков</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-accent-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-accent-500" />
                        <span className="text-2xl text-neutral-900">{stats.activeStudents || 0}</span>
                    </div>
                    <p className="text-sm text-neutral-600">Активных учеников</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-secondary-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <Star className="w-8 h-8 text-yellow-500" />
                        <span className="text-2xl text-neutral-900">
                            {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                        </span>
                    </div>
                    <p className="text-sm text-neutral-600">Средний рейтинг</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-primary-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        <span className="text-2xl text-neutral-900">{stats.reviewsCount || 0}</span>
                    </div>
                    <p className="text-sm text-neutral-600">Отзывов</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-neutral-900">Предстоящие уроки</h3>
                            {upcomingLessons.length > 0 && (
                                <span className="text-sm text-neutral-600">
                                    {upcomingLessons.length} урок(а)
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            {upcomingLessons.length > 0 ? (
                                upcomingLessons.map(lesson => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        viewType="tutor"
                                        // onAction={(action, data) => handleLessonAction(lesson.id, action, data)}
                                        onAction={handleLessonAction}
                                        occupiedSlots={occupiedSlots}
                                    />
                                ))
                            ) : (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-primary-100">
                                    <p className="text-neutral-600">У тебя пока нет запланированных уроков</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {pendingRequests.length > 0 && (
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-neutral-900">Новые запросы</h3>
                                <span className="text-sm text-neutral-600">
                                    {pendingRequests.length} запрос(ов)
                                </span>
                            </div>

                            <div className="space-y-4">
                                {pendingRequests.map(lesson => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        viewType="tutor"
                                        onAction={(action, data) => handleLessonAction(lesson.id, action, data)}
                                        occupiedSlots={occupiedSlots}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-neutral-900">Уведомления</h3>
                            {notifications.length > 0 && (
                                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                    {notifications.length} новых
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <div
                                        key={notification.id || index}
                                        className={`border rounded-lg p-4 ${
                                            notification.type === 'review'
                                                ? 'bg-secondary-50 border-secondary-200'
                                                : notification.type === 'reminder'
                                                    ? 'bg-primary-50 border-primary-200'
                                                    : notification.type === 'request'
                                                        ? 'bg-accent-50 border-accent-200'
                                                        : 'bg-neutral-50 border-neutral-200'
                                        }`}
                                    >
                                        <p className="text-sm font-medium mb-1">
                                            {notification.type === 'review' ? 'Новый отзыв' :
                                                notification.type === 'reminder' ? 'Напоминание' :
                                                    notification.type === 'request' ? 'Новый запрос' :
                                                        'Уведомление'}
                                        </p>
                                        <p className="text-xs opacity-80">
                                            {notification.message || 'Без текста'}
                                        </p>
                                        {notification.createdAt && (
                                            <span className="text-xs opacity-60 mt-2 block">
                                                {new Date(notification.createdAt).toLocaleDateString('ru-RU')}
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-neutral-200">
                                    <p className="text-neutral-600 text-sm">Нет новых уведомлений</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-6 border border-primary-200">
                        <h4 className="text-neutral-900 mb-2">Доход за месяц</h4>
                        <p className="text-3xl text-primary-600 mb-2">
                            {stats.monthlyEarnings ? `${stats.monthlyEarnings.toLocaleString('ru-RU')} ₽` : '0 ₽'}
                        </p>
                        <p className="text-xs text-neutral-600">
                            {stats.earningsGrowth ? `+${stats.earningsGrowth}% по сравнению с прошлым месяцем` : 'Нет данных'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}