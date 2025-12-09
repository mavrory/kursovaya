import { useEffect, useState } from 'react';
import { Calendar, Star, BookOpen, TrendingUp } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';
import { TutorCard } from '../components/TutorCard';

export function StudentDashboard({ onViewTutorDetails }) {
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [stats, setStats] = useState({
        upcomingCount: 0,
        completedCount: 0,
        averageRating: 0,
        progress: 0
    });
    const [recommendedTutors, setRecommendedTutors] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState('');

    const API_URL = "http://localhost:5000/api";

    // Функция для форматирования урока из формата бекенда
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
                id: lesson.lesson_id || lesson.id,
                lesson_id: lesson.lesson_id || lesson.id,
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
                setUserName(user.name || 'Студент');

                // Получаем все данные параллельно
                const [lessonsRes, statsRes, tutorsRes, notificationsRes] = await Promise.all([
                    fetch(`${API_URL}/lessons/student/upcoming`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(`${API_URL}/dashboard/student/stats`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(`${API_URL}/tutors/recommended`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(`${API_URL}/notifications`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);

                // Проверяем все ответы
                const errorResponses = [];
                if (!lessonsRes.ok) errorResponses.push('Уроки');
                if (!statsRes.ok) errorResponses.push('Статистика');
                if (!tutorsRes.ok) errorResponses.push('Репетиторы');
                if (!notificationsRes.ok) errorResponses.push('Уведомления');

                if (errorResponses.length > 0) {
                    throw new Error(`Ошибка загрузки: ${errorResponses.join(', ')}`);
                }

                // Парсим JSON
                const [lessonsData, statsData, tutorsData, notificationsData] = await Promise.all([
                    lessonsRes.json(),
                    statsRes.json(),
                    tutorsRes.json(),
                    notificationsRes.json()
                ]);

                // Форматируем уроки для совместимости с LessonCard
                const formattedLessons = Array.isArray(lessonsData)
                    ? lessonsData.map(formatLesson)
                    : [];

                // Устанавливаем данные
                setUpcomingLessons(formattedLessons);
                setStats(statsData);
                setRecommendedTutors(Array.isArray(tutorsData) ? tutorsData : []);
                setNotifications(Array.isArray(notificationsData) ? notificationsData : []);

            } catch (err) {
                console.error('Ошибка загрузки дашборда:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);




    const handleLessonAction = async (lessonId, action, data = {}) => {
        console.log('🚀 Student handleLessonAction called:', { lessonId, action, data });

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
                    break;

                // 3. ПРИНЯТИЕ ПЕРЕНОСА
                case 'accept_reschedule':
                    url = `${API_URL}/change-requests/lesson/${lessonId}/process`;
                    method = 'PUT';
                    bodyData = JSON.stringify({ action: 'accept' });
                    break;

                // 4. ОТКЛОНЕНИЕ ПЕРЕНОСА
                case 'reject_reschedule':
                    url = `${API_URL}/change-requests/lesson/${lessonId}/process`;
                    method = 'PUT';
                    bodyData = JSON.stringify({ action: 'reject' });
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

            // ОБНОВЛЕНИЕ UI - удаляем урок из списка
            if (action === 'cancel') {
                const updatedLessons = upcomingLessons.filter(lesson =>
                    lesson.id !== lessonId && lesson.lesson_id !== lessonId
                );
                setUpcomingLessons(updatedLessons);
            }

            // Для действий с переносом обновляем данные
            if (action.includes('reschedule')) {
                // Перезагружаем данные дашборда
                const fetchData = async () => {
                    try {
                        const lessonsRes = await fetch(`${API_URL}/lessons/student/upcoming`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (lessonsRes.ok) {
                            const lessonsData = await lessonsRes.json();
                            const formattedLessons = Array.isArray(lessonsData)
                                ? lessonsData.map(formatLesson)
                                : [];
                            setUpcomingLessons(formattedLessons);
                        }
                    } catch (err) {
                        console.error('Ошибка обновления данных:', err);
                    }
                };

                fetchData();
            }

            // СООБЩЕНИЯ ОБ УСПЕХЕ
            const actionMessages = {
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
                <h1 className="text-neutral-900 mb-2">Привет, {userName}! 👋</h1>
                <p className="text-neutral-600">Добро пожаловать в твой личный кабинет</p>
            </div>

            {/* Stats Cards */}
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
                        <BookOpen className="w-8 h-8 text-accent-500" />
                        <span className="text-2xl text-neutral-900">{stats.completedCount || 0}</span>
                    </div>
                    <p className="text-sm text-neutral-600">Завершенных уроков</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-secondary-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <Star className="w-8 h-8 text-yellow-500" />
                        <span className="text-2xl text-neutral-900">
                            {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                        </span>
                    </div>
                    <p className="text-sm text-neutral-600">Средняя оценка</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-primary-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        <span className="text-2xl text-neutral-900">+{stats.progress || 0}%</span>
                    </div>
                    <p className="text-sm text-neutral-600">Прогресс знаний</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Upcoming Lessons */}
                <div className="lg:col-span-2">
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
                                    viewType="student"
                                    // ПЕРЕДАЕМ data
                                    onAction={handleLessonAction}
                                    // onAction={(action, data) => handleLessonAction(lesson.id, action, data)}
                                />
                            ))
                        ) : (
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-primary-100">
                                <p className="text-neutral-600">У тебя пока нет запланированных уроков</p>
                                <button
                                    onClick={() => onViewTutorDetails && onViewTutorDetails()}
                                    className="mt-4 text-primary-600 hover:underline"
                                >
                                    Найти репетитора
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div>
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
                                            ? 'bg-accent-50 border-accent-200'
                                            : notification.type === 'reminder'
                                                ? 'bg-primary-50 border-primary-200'
                                                : 'bg-secondary-50 border-secondary-200'
                                    }`}
                                >
                                    <p className="text-sm font-medium mb-1">
                                        {notification.type === 'review' ? 'Новый отзыв' :
                                            notification.type === 'reminder' ? 'Напоминание' : 'Опрос'}
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
            </div>

            {/* Recommended Tutors */}
            {recommendedTutors.length > 0 && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-neutral-900">Рекомендуемые репетиторы</h3>
                        <button
                            onClick={() => onViewTutorDetails && onViewTutorDetails()}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            Смотреть всех
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {recommendedTutors.map(tutor => (
                            <TutorCard
                                key={tutor.id}
                                tutor={tutor}
                                onViewDetails={() => onViewTutorDetails(tutor.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}