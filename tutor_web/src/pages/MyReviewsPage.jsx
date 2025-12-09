// import { Star } from 'lucide-react';
// import { Button } from '../components/ui/button';
// import { Textarea } from '../components/ui/textarea';
// import { Label } from '../components/ui/label';
// import { ReviewCard } from '../components/ReviewCard';
// import { EmptyState } from '../components/EmptyState';
// import { reviews, lessons } from '../lib/mock-data';
// import { useState } from 'react';
//
// export function MyReviewsPage() {
//   const [rating, setRating] = useState(0);
//   const [comment, setComment] = useState('');
//
//   const myReviews = reviews.filter(r => r.studentId === 's1');
//   const completedLessonsWithoutReview = lessons.filter(l =>
//     l.status === 'completed' &&
//     !myReviews.some(r => r.tutorId === l.tutorId)
//   );
//
//   const handleSubmitReview = (e) => {
//     e.preventDefault();
//     // В реальном приложении здесь была бы отправка отзыва
//     alert('Спасибо за отзыв!');
//     setRating(0);
//     setComment('');
//   };
//
//   return (
//     <div>
//       <div className="mb-8">
//         <h1 className="text-neutral-900 mb-2">Мои отзывы</h1>
//         <p className="text-neutral-600">Оставляй отзывы о своих занятиях с репетиторами</p>
//       </div>
//
//       <div className="grid lg:grid-cols-3 gap-6">
//         {/* Review Form */}
//         <div className="lg:col-span-1">
//           <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 sticky top-6">
//             <h3 className="text-neutral-900 mb-4">Оставить отзыв</h3>
//
//             {completedLessonsWithoutReview.length > 0 ? (
//               <form onSubmit={handleSubmitReview} className="space-y-4">
//                 <div>
//                   <Label>Репетитор</Label>
//                   <select className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg">
//                     {completedLessonsWithoutReview.map(lesson => (
//                       <option key={lesson.id} value={lesson.tutorId}>
//                         {lesson.tutorName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//
//                 <div>
//                   <Label>Оценка</Label>
//                   <div className="flex gap-2 mt-2">
//                     {[1, 2, 3, 4, 5].map((value) => (
//                       <button
//                         key={value}
//                         type="button"
//                         onClick={() => setRating(value)}
//                         className="focus:outline-none"
//                       >
//                         <Star
//                           className={`w-8 h-8 transition-colors ${
//                             value <= rating
//                               ? 'fill-yellow-400 text-yellow-400'
//                               : 'text-neutral-300'
//                           }`}
//                         />
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//
//                 <div>
//                   <Label htmlFor="comment">Комментарий</Label>
//                   <Textarea
//                     id="comment"
//                     value={comment}
//                     onChange={(e) => setComment(e.target.value)}
//                     placeholder="Расскажи о своем опыте занятий..."
//                     rows={5}
//                     className="mt-1"
//                   />
//                 </div>
//
//                 <Button
//                   type="submit"
//                   className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
//                   disabled={rating === 0 || !comment.trim()}
//                 >
//                   Отправить отзыв
//                 </Button>
//               </form>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-sm text-neutral-600">
//                   У тебя нет завершенных уроков для отзыва
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//
//         {/* My Reviews List */}
//         <div className="lg:col-span-2">
//           <h3 className="text-neutral-900 mb-4">Мои отзывы ({myReviews.length})</h3>
//           {myReviews.length > 0 ? (
//             <div className="space-y-4">
//               {myReviews.map(review => (
//                 <ReviewCard key={review.id} review={review} />
//               ))}
//             </div>
//           ) : (
//             <EmptyState
//               title="У тебя пока нет отзывов"
//               description="После завершения урока ты сможешь оставить отзыв о репетиторе"
//               animalType="panda"
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ReviewCard } from '../components/ReviewCard';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-hot-toast';

export function MyReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Форма отзыва
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedLessonId, setSelectedLessonId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const API_URL = import.meta.env?.VITE_API_URL ||
        import.meta.env?.REACT_APP_API_URL ||
        'http://localhost:5000/api';

    // ============================================
    // ТРЕБОВАНИЯ К БЭКЕНДУ:
    //
    // 1. GET /api/reviews/my - получить отзывы текущего пользователя
    //    Ответ: массив отзывов со структурой:
    //    [
    //      {
    //        review_id: number,
    //        lesson_id: number,
    //        tutor_id: number,
    //        tutor_name: string,
    //        tutor_avatar?: string,
    //        rating: number (1-5),
    //        comment: string,
    //        created_at: string (ISO),
    //        lesson_subject: string
    //      }
    //    ]
    //
    // 2. GET /api/lessons/completed-without-review - завершенные уроки без отзыва
    //    Ответ: массив уроков для которых можно оставить отзыв
    //
    // 3. POST /api/reviews - создать новый отзыв
    //    Тело: { lesson_id: number, rating: number (1-5), comment: string }
    // ============================================

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        console.log('📝 [MyReviews] Загрузка данных...');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            // Параллельно загружаем отзывы и уроки
            const [reviewsResponse, lessonsResponse] = await Promise.all([
                fetch(`${API_URL}/reviews/my`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${API_URL}/lessons/completed-without-review`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            // Проверяем ответы
            if (!reviewsResponse.ok) {
                console.warn('⚠️ [MyReviews] Ошибка загрузки отзывов:', reviewsResponse.status);
            }

            if (!lessonsResponse.ok) {
                console.warn('⚠️ [MyReviews] Ошибка загрузки уроков:', lessonsResponse.status);
            }

            // Обрабатываем отзывы
            let reviewsData = [];
            if (reviewsResponse.ok) {
                reviewsData = await reviewsResponse.json();
                console.log('✅ [MyReviews] Отзывы загружены:', reviewsData);
            }

            // Обрабатываем уроки
            let lessonsData = [];
            if (lessonsResponse.ok) {
                lessonsData = await lessonsResponse.json();
                console.log('✅ [MyReviews] Уроки загружены:', lessonsData);
            }

            // Преобразуем данные
            const processedReviews = processReviewsData(reviewsData);
            const processedLessons = processLessonsData(lessonsData);

            setReviews(processedReviews);
            setLessons(processedLessons);

            // Выбираем первый урок по умолчанию
            if (processedLessons.length > 0 && !selectedLessonId) {
                setSelectedLessonId(processedLessons[0].id);
            }

        } catch (error) {
            console.error('❌ [MyReviews] Ошибка загрузки:', error);
            setError(error.message);
            toast.error(`Ошибка: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // const processReviewsData = (data) => {
    //     if (!Array.isArray(data)) return [];
    //
    //     return data.map(review => ({
    //         id: review.review_id || review.id,
    //         lessonId: review.lesson_id,
    //         tutorId: review.tutor_id,
    //         tutorName: review.tutor_name || 'Неизвестный репетитор',
    //         tutorAvatar: review.tutor_avatar || review.tutor_avatar_url,
    //         rating: Number(review.rating) || 0,
    //         comment: review.comment || '',
    //         createdAt: review.created_at || review.createdAt,
    //         lessonSubject: review.lesson_subject || review.subject,
    //         date: review.created_at ?
    //             new Date(review.created_at).toLocaleDateString('ru-RU') :
    //             'Недавно'
    //     }));
    // };
    const processReviewsData = (data) => {
        if (!Array.isArray(data)) return [];

        return data.map(review => {
            // Безопасное форматирование даты
            let formattedDate = 'Недавно';
            let dateForDisplay = '';

            try {
                if (review.created_at) {
                    const date = new Date(review.created_at);
                    if (!isNaN(date.getTime())) {
                        // Формат для отображения: "15 декабря 2024"
                        formattedDate = date.toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });

                        // Дополнительно: дата в формате "15.12.2024" для сравнения
                        dateForDisplay = date.toLocaleDateString('ru-RU');
                    }
                }
            } catch (error) {
                console.warn('Ошибка форматирования даты:', error);
            }

            return {
                id: review.review_id || review.id,
                lessonId: review.lesson_id,
                tutorId: review.tutor_id,
                tutorName: review.tutor_name || 'Неизвестный репетитор',
                tutorAvatar: review.tutor_avatar || review.tutor_avatar_url || null,
                rating: Number(review.rating) || 0,
                comment: review.comment || '',
                createdAt: review.created_at || review.createdAt,
                lessonSubject: review.lesson_subject || review.subject || 'Не указано',
                date: formattedDate, // Форматированная дата
                rawDate: dateForDisplay // Дополнительно для сортировки
            };
        });
    };

    const processLessonsData = (data) => {
        if (!Array.isArray(data)) return [];

        return data.map(lesson => ({
            id: lesson.lesson_id || lesson.id,
            tutorId: lesson.tutor_id,
            tutorName: lesson.tutor_name || lesson.tutor?.name || 'Неизвестный репетитор',
            subject: lesson.subject_name || lesson.subject,
            completedAt: lesson.completed_at || lesson.completedAt
        }));
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!selectedLessonId || rating === 0 || !comment.trim()) {
            toast.error('Заполните все поля');
            return;
        }

        setSubmitting(true);
        console.log('📤 [MyReviews] Отправка отзыва:', { selectedLessonId, rating, comment });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lesson_id: selectedLessonId,
                    rating: rating,
                    comment: comment.trim()
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ [MyReviews] Отзыв отправлен:', result);

            // Сбрасываем форму
            setRating(0);
            setComment('');

            // Перезагружаем данные
            await loadData();

            toast.success('Спасибо за ваш отзыв!');

        } catch (error) {
            console.error('❌ [MyReviews] Ошибка отправки отзыва:', error);
            toast.error(`Ошибка: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedLesson = lessons.find(l => l.id === selectedLessonId);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем ваши отзывы...</p>
                </div>
            </div>
        );
    }


    return (
        <div>
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-neutral-900 mb-2">Мои отзывы</h1>
                        <p className="text-neutral-600">Оставляйте отзывы о занятиях с репетиторами</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Форма отзыва */}
                <div className="lg:col-span-1">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100">
                        <h3 className="text-neutral-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Оставить отзыв
                        </h3>

                        {lessons.length > 0 ? (
                            <form onSubmit={handleSubmitReview} className="space-y-4">
                                <div>
                                    <Label>Репетитор и урок</Label>
                                    <select
                                        value={selectedLessonId}
                                        onChange={(e) => setSelectedLessonId(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                                        disabled={submitting}
                                    >
                                        {lessons.map(lesson => (
                                            <option key={lesson.id} value={lesson.id}>
                                                {lesson.tutorName} - {lesson.subject}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedLesson && (
                                        <p className="text-xs text-neutral-500 mt-1">
                                            Завершен: {selectedLesson.completedAt ?
                                            new Date(selectedLesson.completedAt).toLocaleDateString('ru-RU') :
                                            'недавно'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Оценка</Label>
                                    <div className="flex gap-2 mt-2">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setRating(value)}
                                                disabled={submitting}
                                                className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Star
                                                    className={`w-8 h-8 transition-colors ${
                                                        value <= rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-neutral-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Выберите от 1 до 5 звезд
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="comment">Комментарий</Label>
                                    <Textarea
                                        id="comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Расскажите о своем опыте занятий..."
                                        rows={5}
                                        className="mt-1"
                                        disabled={submitting}
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Минимум 10 символов
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white disabled:opacity-50"
                                    disabled={rating === 0 || !comment.trim() || comment.trim().length < 10 || submitting}
                                >
                                    {submitting ? 'Отправка...' : 'Отправить отзыв'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                                    <Star className="w-8 h-8 text-neutral-400" />
                                </div>
                                <p className="text-neutral-600 mb-2">Нет уроков для отзыва</p>
                                <p className="text-sm text-neutral-500">
                                    Завершите несколько уроков, чтобы оставить отзыв
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Список отзывов */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-neutral-900">
                            Мои отзывы ({reviews.length})
                        </h3>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="text-sm text-primary-600 hover:underline disabled:opacity-50"
                        >
                            Обновить
                        </button>
                    </div>

                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="У вас пока нет отзывов"
                            description="После завершения урока вы сможете оставить отзыв о репетиторе"
                            animalType="panda"
                        />
                    )}
                </div>
            </div>

            {/* Информация о данных */}
            {/* Отладочная информация - только в development */}
            {(import.meta.env?.MODE === 'development' || window.location.hostname === 'localhost') && (
                <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-neutral-700">
                            Отладочная информация
                        </summary>
                        <div className="mt-4 space-y-4 text-xs">
                            <div>
                                <p className="font-medium">Доступные уроки для отзыва: {lessons.length}</p>
                                <p className="font-medium">Мои отзывы: {reviews.length}</p>
                                <p>Выбранный урок ID: {selectedLessonId}</p>
                                <p>API URL: {API_URL}</p>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}