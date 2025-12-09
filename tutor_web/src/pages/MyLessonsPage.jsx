// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
// import { LessonCard } from '../components/LessonCard';
// import { EmptyState } from '../components/EmptyState';
// import { lessons } from '../lib/mock-data';
//
// export function MyLessonsPage() {
//   const scheduledLessons = lessons.filter(l => l.status === 'scheduled');
//   const completedLessons = lessons.filter(l => l.status === 'completed');
//   const cancelledLessons = lessons.filter(l => l.status === 'cancelled');
//   const pendingLessons = lessons.filter(l => l.status === 'pending');
//
//   return (
//     <div>
//       <div className="mb-8">
//         <h1 className="text-neutral-900 mb-2">Мои уроки</h1>
//         <p className="text-neutral-600">Управляй своим расписанием и историей уроков</p>
//       </div>
//
//       <Tabs defaultValue="scheduled" className="w-full">
//         <TabsList className="mb-6">
//           <TabsTrigger value="scheduled">
//             Запланированные ({scheduledLessons.length})
//           </TabsTrigger>
//           <TabsTrigger value="pending">
//             Ожидают подтверждения ({pendingLessons.length})
//           </TabsTrigger>
//           <TabsTrigger value="completed">
//             Завершенные ({completedLessons.length})
//           </TabsTrigger>
//           <TabsTrigger value="cancelled">
//             Отмененные ({cancelledLessons.length})
//           </TabsTrigger>
//         </TabsList>
//
//         <TabsContent value="scheduled">
//           {scheduledLessons.length > 0 ? (
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {scheduledLessons.map(lesson => (
//                 <LessonCard key={lesson.id} lesson={lesson} viewType="student" />
//               ))}
//             </div>
//           ) : (
//             <EmptyState
//               title="Нет запланированных уроков"
//               description="Найди репетитора и забронируй свой первый урок!"
//               animalType="fox"
//             />
//           )}
//         </TabsContent>
//
//         <TabsContent value="pending">
//           {pendingLessons.length > 0 ? (
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {pendingLessons.map(lesson => (
//                 <LessonCard key={lesson.id} lesson={lesson} viewType="student" />
//               ))}
//             </div>
//           ) : (
//             <EmptyState
//               title="Нет ожидающих уроков"
//               description="Здесь будут отображаться уроки, ожидающие подтверждения репетитора"
//               animalType="raccoon"
//             />
//           )}
//         </TabsContent>
//
//         <TabsContent value="completed">
//           {completedLessons.length > 0 ? (
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {completedLessons.map(lesson => (
//                 <LessonCard key={lesson.id} lesson={lesson} viewType="student" />
//               ))}
//             </div>
//           ) : (
//             <EmptyState
//               title="Нет завершенных уроков"
//               description="После завершения уроков они появятся здесь"
//               animalType="panda"
//             />
//           )}
//         </TabsContent>
//
//         <TabsContent value="cancelled">
//           {cancelledLessons.length > 0 ? (
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {cancelledLessons.map(lesson => (
//                 <LessonCard key={lesson.id} lesson={lesson} viewType="student" />
//               ))}
//             </div>
//           ) : (
//             <EmptyState
//               title="Нет отмененных уроков"
//               description="Отличная новость! У тебя не было отмененных уроков"
//               animalType="cat"
//             />
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { LessonCard } from '../components/LessonCard';
import { EmptyState } from '../components/EmptyState';
import { RefreshCw, AlertCircle, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function MyLessonsPage({ userRole = 'student' }) {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('scheduled');

    const API_URL = import.meta.env?.VITE_API_URL ||
        import.meta.env?.REACT_APP_API_URL ||
        'http://localhost:5000/api';

    // ============================================
    // ТРЕБОВАНИЯ К БЭКЕНДУ:
    //
    // GET /api/lessons - должен вернуть уроки пользователя
    // Для студента: уроки где student_id = текущий пользователь
    // Для репетитора: уроки где tutor_id = текущий пользователь
    //
    // Формат ответа должен содержать ВСЕ необходимые поля:
    // - lesson_id, scheduled_for, duration, price, status
    // - subject_name (или subject.name)
    // - tutor объект (для студента) или student объект (для репетитора)
    // - meeting_link, meeting_platform (опционально)
    // - rating, review, completed_at, cancelled_reason (опционально)
    // ============================================

    useEffect(() => {
        loadLessons();
    }, [userRole]);

    const loadLessons = async () => {
        setLoading(true);
        setError(null);
        console.log(`📅 [MyLessons] Загрузка уроков для роли: ${userRole}`);

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`${API_URL}/lessons`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 [MyLessons] Ответ сервера:', {
                status: response.status,
                statusText: response.statusText,
                url: `${API_URL}/lessons`
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [MyLessons] Ошибка сервера:', errorText);

                if (response.status === 401) {
                    throw new Error('Сессия истекла. Пожалуйста, войдите снова');
                } else if (response.status === 403) {
                    throw new Error('Доступ запрещен');
                } else if (response.status === 404) {
                    throw new Error('Endpoint /api/lessons не найден. Проверьте роутинг бэкенда');
                } else {
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
            }

            const lessonsData = await response.json();
            console.log('✅ [MyLessons] Данные получены:', lessonsData);

            // Проверяем структуру данных
            if (!Array.isArray(lessonsData)) {
                console.warn('⚠️ [MyLessons] Данные не являются массивом:', lessonsData);
                throw new Error('Некорректный формат данных от сервера');
            }

            // Преобразуем данные в формат компонента
            const processedLessons = processLessonsData(lessonsData);
            console.log('🔧 [MyLessons] Обработано уроков:', processedLessons.length);

            setLessons(processedLessons);
            toast.success(`Загружено ${processedLessons.length} уроков`);

        } catch (error) {
            console.error('❌ [MyLessons] Критическая ошибка:', error);
            setError(error.message);
            toast.error(`Ошибка загрузки: ${error.message}`);

            // При ошибке показываем пустой список
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    // Преобразование данных с бэкенда в формат компонента
    const processLessonsData = (data) => {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(lesson => {
            try {
                const viewType = userRole === 'tutor' ? 'tutor' : 'student';
                const otherParty = userRole === 'tutor' ? lesson.student : lesson.tutor;

                const processedLesson = {
                    id: lesson.lesson_id || lesson.id,
                    subject: lesson.subject_name || lesson.subject?.name || 'Не указано',
                    scheduledFor: lesson.scheduled_for || lesson.scheduledFor || new Date().toISOString(),
                    duration: Number(lesson.duration) || 60,
                    price: Number(lesson.price) || 0,
                    status: lesson.status || 'pending',
                    meetingLink: lesson.meeting_link || lesson.meetingLink,
                    meetingPlatform: lesson.meeting_platform || lesson.meetingPlatform,
                    rating: lesson.rating ? Number(lesson.rating) : undefined,
                    review: lesson.review,
                    completedAt: lesson.completed_at || lesson.completedAt,
                    cancelledReason: lesson.cancelled_reason || lesson.cancelledReason,
                    description: lesson.description || `Урок по ${lesson.subject_name || 'предмету'}`
                };

                // Добавляем информацию о второй стороне
                if (otherParty) {
                    if (viewType === 'student') {
                        processedLesson.tutor = {
                            id: otherParty.user_id || otherParty.id,
                            name: otherParty.name || 'Неизвестный репетитор',
                            email: otherParty.email || '',
                            avatar: otherParty.avatar_url || otherParty.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParty.name || 'Репетитор')}`
                        };
                    } else {
                        processedLesson.student = {
                            id: otherParty.user_id || otherParty.id,
                            name: otherParty.name || 'Неизвестный ученик',
                            email: otherParty.email || '',
                            avatar: otherParty.avatar_url || otherParty.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParty.name || 'Ученик')}`
                        };
                    }
                }

                return processedLesson;
            } catch (err) {
                console.warn('⚠️ [MyLessons] Ошибка обработки урока:', err, lesson);
                return null;
            }
        }).filter(lesson => lesson !== null); // Фильтруем некорректные записи
    };

    // Обработчик действий с уроками
    const handleLessonAction = async (action, lessonId, data) => {
        console.log(`⚡ [MyLessons] Действие: ${action} для урока ${lessonId}`);

        try {
            const token = localStorage.getItem('token');

            let endpoint, method, body;

            if (action === 'rate') {
                // Оценка урока
                endpoint = `${API_URL}/lessons/${lessonId}/rate`;
                method = 'POST';
                body = JSON.stringify({
                    rating: data.rating,
                    review: data.review
                });
            } else if (action === 'reschedule') {
                // Для переноса нужны дата и время - они должны быть переданы из формы
                if (!data || !data.proposed_date || !data.proposed_time) {
                    throw new Error('Дата и время обязательны для переноса. Пожалуйста, заполните форму.');
                }
                
                endpoint = `${API_URL}/lessons/${lessonId}/actions`;
                method = 'POST';
                body = JSON.stringify({ 
                    action: 'reschedule',
                    proposed_date: data.proposed_date,
                    proposed_time: data.proposed_time,
                    comment: data.comment || null
                });
            } else {
                // Другие действия
                endpoint = `${API_URL}/lessons/${lessonId}/actions`;
                method = 'POST';
                body = JSON.stringify({ action });
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body
            });

            console.log('📡 [MyLessons] Ответ на действие:', {
                status: response.status,
                action,
                lessonId
            });

            if (!response.ok) {
                throw new Error(`Сервер вернул ошибку: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ [MyLessons] Действие успешно:', result);

            // Перезагружаем данные с сервера для синхронизации
            await loadLessons();

            // Уведомление пользователя
            const messages = {
                'cancel': 'Урок успешно отменен',
                'reschedule': 'Запрос на перенос отправлен репетитору',
                'accept': 'Урок принят',
                'reject': 'Урок отклонен',
                'rate': 'Спасибо за ваш отзыв!'
            };

            toast.success(messages[action] || 'Действие выполнено');

        } catch (error) {
            console.error('❌ [MyLessons] Ошибка выполнения действия:', error);
            toast.error(`Не удалось выполнить действие: ${error.message}`);
        }
    };

    // Фильтрация уроков по статусу
    const filteredLessons = {
        scheduled: lessons.filter(l => l.status === 'scheduled'),
        pending: lessons.filter(l => l.status === 'pending'),
        completed: lessons.filter(l => l.status === 'completed'),
        cancelled: lessons.filter(l => l.status === 'cancelled')
    };

    // Статистика для отображения
    const stats = {
        scheduled: filteredLessons.scheduled.length,
        pending: filteredLessons.pending.length,
        completed: filteredLessons.completed.length,
        cancelled: filteredLessons.cancelled.length
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем ваши уроки...</p>
                    <p className="text-sm text-neutral-500 mt-2">
                        Запрашиваем данные с {API_URL}/lessons
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            {/* Заголовок и управление */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-neutral-900 mb-2">
                            {userRole === 'tutor' ? 'Мои уроки (репетитор)' : 'Мои уроки'}
                        </h1>
                        <p className="text-neutral-600">
                            {userRole === 'tutor'
                                ? 'Управляйте расписанием уроков'
                                : 'Управляйте своим расписанием уроков'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={loadLessons}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Загрузка...' : 'Обновить'}
                        </button>
                    </div>
                </div>

                {/* Статистика */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-700">Запланировано</p>
                                <p className="text-2xl font-semibold text-blue-900">{stats.scheduled}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-yellow-700">Ожидают</p>
                                <p className="text-2xl font-semibold text-yellow-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-700">Завершено</p>
                                <p className="text-2xl font-semibold text-green-900">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-red-700">Отменено</p>
                                <p className="text-2xl font-semibold text-red-900">{stats.cancelled}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Вкладки с уроками */}
            <Tabs defaultValue="scheduled" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="scheduled">
                        Запланированные ({stats.scheduled})
                    </TabsTrigger>

                    <TabsTrigger value="pending">
                        Ожидают ({stats.pending})
                    </TabsTrigger>

                    <TabsTrigger value="completed">
                        Завершенные ({stats.completed})
                    </TabsTrigger>

                    <TabsTrigger value="cancelled">
                        Отмененные ({stats.cancelled})
                    </TabsTrigger>
                </TabsList>

                {/* Содержимое вкладок */}
                <TabsContent value="scheduled" className="space-y-6">
                    {filteredLessons.scheduled.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLessons.scheduled.map(lesson => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    viewType={userRole}
                                    onAction={handleLessonAction}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Нет запланированных уроков"
                            description={userRole === 'tutor'
                                ? "Здесь будут отображаться ваши будущие уроки с учениками"
                                : "Найдите репетитора и забронируйте свой первый урок!"}
                            animalType="fox"
                        />
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-6">
                    {filteredLessons.pending.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLessons.pending.map(lesson => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    viewType={userRole}
                                    onAction={handleLessonAction}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Нет ожидающих уроков"
                            description={userRole === 'tutor'
                                ? "Здесь будут отображаться заявки на уроки от учеников"
                                : "Здесь будут отображаться уроки, ожидающие подтверждения репетитора"}
                            animalType="raccoon"
                        />
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-6">
                    {filteredLessons.completed.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLessons.completed.map(lesson => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    viewType={userRole}
                                    onAction={handleLessonAction}
                                    onRate={(lessonId, rating, review) =>
                                        handleLessonAction('rate', lessonId, { rating, review })
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Нет завершенных уроков"
                            description={userRole === 'tutor'
                                ? "После проведения уроков они появятся здесь"
                                : "После завершения уроков они появятся здесь"}
                            animalType="panda"
                        />
                    )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-6">
                    {filteredLessons.cancelled.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLessons.cancelled.map(lesson => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    viewType={userRole}
                                    onAction={handleLessonAction}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Нет отмененных уроков"
                            description="Отличная новость! У вас не было отмененных уроков"
                            animalType="cat"
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Информация о данных (только если есть ошибки) */}
            {error && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-800 mb-1">Проблема с загрузкой данных</p>
                            <p className="text-sm text-yellow-700 mb-2">
                                Проверьте, что бэкенд доступен по адресу: <code className="bg-yellow-100 px-2 py-1 rounded">{API_URL}/lessons</code>
                            </p>
                            <p className="text-sm text-yellow-700">
                                Ожидаемые поля в ответе: <code className="bg-yellow-100 px-2 py-1 rounded">lesson_id, scheduled_for, status, subject_name, tutor/student объект</code>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}