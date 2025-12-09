// import { useState } from 'react';
// import { Button } from '../components/ui/button';
// import { Label } from '../components/ui/label';
// import { Textarea } from '../components/ui/textarea';
// import { Slider } from '../components/ui/slider';
// import { lessons, surveys } from '../lib/mock-data';
// import { EmptyState } from '../components/EmptyState';
//
// export function SurveysPage() {
//   const [satisfactionLevel, setSatisfactionLevel] = useState([3]);
//   const [knowledgeGrowth, setKnowledgeGrowth] = useState([3]);
//   const [comments, setComments] = useState('');
//
//   const completedLessons = lessons.filter(l =>
//     l.status === 'completed' &&
//     !surveys.some(s => s.lessonId === l.id)
//   );
//
//   const handleSubmitSurvey = (e) => {
//     e.preventDefault();
//     alert('Спасибо за участие в опросе!');
//     setSatisfactionLevel([3]);
//     setKnowledgeGrowth([3]);
//     setComments('');
//   };
//
//   return (
//     <div>
//       <div className="mb-8">
//         <h1 className="text-neutral-900 mb-2">Опросы удовлетворенности</h1>
//         <p className="text-neutral-600">Помоги нам улучшить качество обучения на платформе</p>
//       </div>
//
//       <div className="max-w-3xl mx-auto">
//         {completedLessons.length > 0 ? (
//           <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-primary-100">
//             <div className="mb-6">
//               <h3 className="text-neutral-900 mb-2">Оцени свой последний урок</h3>
//               <p className="text-sm text-neutral-600">
//                 Урок: <span className="text-neutral-900">{completedLessons[0].subject}</span> с {completedLessons[0].tutorName}
//               </p>
//             </div>
//
//             <form onSubmit={handleSubmitSurvey} className="space-y-6">
//               <div>
//                 <Label className="mb-2">
//                   Уровень удовлетворенности: <span className="text-primary-600">{satisfactionLevel[0]}/5</span>
//                 </Label>
//                 <p className="text-xs text-neutral-500 mb-3">
//                   Насколько ты доволен качеством проведенного урока?
//                 </p>
//                 <Slider
//                   value={satisfactionLevel}
//                   onValueChange={setSatisfactionLevel}
//                   min={1}
//                   max={5}
//                   step={1}
//                   className="mt-2"
//                 />
//                 <div className="flex justify-between mt-2 text-xs text-neutral-500">
//                   <span>Очень недоволен</span>
//                   <span>Очень доволен</span>
//                 </div>
//               </div>
//
//               <div>
//                 <Label className="mb-2">
//                   Прогресс знаний: <span className="text-accent-600">{knowledgeGrowth[0]}/5</span>
//                 </Label>
//                 <p className="text-xs text-neutral-500 mb-3">
//                   Насколько вырос уровень твоих знаний после урока?
//                 </p>
//                 <Slider
//                   value={knowledgeGrowth}
//                   onValueChange={setKnowledgeGrowth}
//                   min={1}
//                   max={5}
//                   step={1}
//                   className="mt-2"
//                 />
//                 <div className="flex justify-between mt-2 text-xs text-neutral-500">
//                   <span>Не вырос</span>
//                   <span>Значительно вырос</span>
//                 </div>
//               </div>
//
//               <div>
//                 <Label htmlFor="survey-comments">Дополнительные комментарии</Label>
//                 <Textarea
//                   id="survey-comments"
//                   value={comments}
//                   onChange={(e) => setComments(e.target.value)}
//                   placeholder="Расскажи подробнее о своем опыте..."
//                   rows={5}
//                   className="mt-1"
//                 />
//               </div>
//
//               <Button
//                 type="submit"
//                 className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
//               >
//                 Отправить опрос
//               </Button>
//             </form>
//           </div>
//         ) : (
//           <EmptyState
//             title="Нет доступных опросов"
//             description="После завершения урока здесь появится опрос для оценки качества обучения"
//             animalType="fox"
//           />
//         )}
//
//         {/* Completed Surveys */}
//         {surveys.length > 0 && (
//           <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-accent-100">
//             <h3 className="text-neutral-900 mb-4">Мои отправленные опросы ({surveys.length})</h3>
//             <div className="space-y-4">
//               {surveys.map(survey => (
//                 <div
//                   key={survey.id}
//                   className="border border-neutral-200 rounded-lg p-4"
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <p className="text-sm text-neutral-900">
//                       Отправлено: {new Date(survey.submittedAt).toLocaleDateString('ru-RU')}
//                     </p>
//                     <div className="flex gap-4 text-sm">
//                       <span className="text-primary-600">
//                         Удовл.: {survey.satisfactionLevel}/5
//                       </span>
//                       <span className="text-accent-600">
//                         Прогресс: {survey.knowledgeGrowth}/5
//                       </span>
//                     </div>
//                   </div>
//                   {survey.comments && (
//                     <p className="text-sm text-neutral-600 mt-2">{survey.comments}</p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Slider } from '../components/ui/slider';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-hot-toast';

export function SurveysPage() {
    const [surveys, setSurveys] = useState([]);
    const [availableLesson, setAvailableLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Форма опроса
    const [satisfactionLevel, setSatisfactionLevel] = useState([3]);
    const [knowledgeGrowth, setKnowledgeGrowth] = useState([3]);
    const [comments, setComments] = useState('');

    const API_URL = import.meta.env?.VITE_API_URL ||
        import.meta.env?.REACT_APP_API_URL ||
        'http://localhost:5000/api';

    // ============================================
    // ТРЕБОВАНИЯ К БЭКЕНДУ:
    //
    // 1. GET /api/surveys/my - получить опросы текущего пользователя
    //    Ответ: массив опросов со структурой:
    //    [
    //      {
    //        survey_id: number,
    //        lesson_id: number,
    //        tutor_id: number,
    //        tutor_name: string,
    //        subject_name: string,
    //        satisfaction_level: number (1-5),
    //        knowledge_growth: number (1-5),
    //        comments: string,
    //        submitted_at: string (ISO)
    //      }
    //    ]
    //
    // 2. GET /api/lessons/available-for-survey - урок доступный для опроса
    //    Ответ: один урок или null
    //    {
    //      lesson_id: number,
    //      tutor_name: string,
    //      subject_name: string,
    //      completed_at: string
    //    }
    //
    // 3. POST /api/surveys - создать новый опрос
    //    Тело: {
    //      lesson_id: number,
    //      satisfaction_level: number (1-5),
    //      knowledge_growth: number (1-5),
    //      comments: string
    //    }
    // ============================================

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        console.log('📊 [Surveys] Загрузка данных...');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            // Параллельно загружаем опросы и доступный урок
            const [surveysResponse, lessonResponse] = await Promise.all([
                fetch(`${API_URL}/surveys/my`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${API_URL}/lessons/available-for-survey`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            // Обрабатываем опросы
            let surveysData = [];
            if (surveysResponse.ok) {
                surveysData = await surveysResponse.json();
                console.log('✅ [Surveys] Опросы загружены:', surveysData);
            } else {
                console.warn('⚠️ [Surveys] Ошибка загрузки опросов:', surveysResponse.status);
            }

            // Обрабатываем доступный урок
            let lessonData = null;
            if (lessonResponse.ok) {
                const data = await lessonResponse.json();
                if (data && Object.keys(data).length > 0) {
                    lessonData = data;
                    console.log('✅ [Surveys] Доступный урок:', lessonData);
                }
            } else {
                console.warn('⚠️ [Surveys] Ошибка загрузки урока:', lessonResponse.status);
            }

            // Преобразуем данные
            const processedSurveys = processSurveysData(surveysData);
            const processedLesson = processLessonData(lessonData);

            setSurveys(processedSurveys);
            setAvailableLesson(processedLesson);

        } catch (error) {
            console.error('❌ [Surveys] Ошибка загрузки:', error);
            setError(error.message);
            toast.error(`Ошибка: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const processSurveysData = (data) => {
        if (!Array.isArray(data)) return [];

        return data.map(survey => ({
            id: survey.survey_id || survey.id,
            lessonId: survey.lesson_id,
            tutorName: survey.tutor_name || 'Неизвестный репетитор',
            subject: survey.subject_name || survey.subject,
            satisfactionLevel: Number(survey.satisfaction_level) || survey.satisfactionLevel,
            knowledgeGrowth: Number(survey.knowledge_growth) || survey.knowledgeGrowth,
            comments: survey.comments || '',
            submittedAt: survey.submitted_at || survey.submittedAt,
            date: survey.submitted_at ?
                new Date(survey.submitted_at).toLocaleDateString('ru-RU') :
                'Недавно'
        }));
    };

    const processLessonData = (data) => {
        if (!data || Object.keys(data).length === 0) return null;

        return {
            id: data.lesson_id || data.id,
            tutorName: data.tutor_name || data.tutor?.name || 'Неизвестный репетитор',
            subject: data.subject_name || data.subject,
            completedAt: data.completed_at || data.completedAt
        };
    };

    const handleSubmitSurvey = async (e) => {
        e.preventDefault();

        if (!availableLesson) {
            toast.error('Нет доступного урока для опроса');
            return;
        }

        setSubmitting(true);
        console.log('📤 [Surveys] Отправка опроса:', {
            lessonId: availableLesson.id,
            satisfactionLevel: satisfactionLevel[0],
            knowledgeGrowth: knowledgeGrowth[0],
            comments
        });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/surveys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lesson_id: availableLesson.id,
                    satisfaction_level: satisfactionLevel[0],
                    knowledge_growth: knowledgeGrowth[0],
                    comments: comments.trim()
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ [Surveys] Опрос отправлен:', result);

            // Сбрасываем форму
            setSatisfactionLevel([3]);
            setKnowledgeGrowth([3]);
            setComments('');

            // Перезагружаем данные
            await loadData();

            toast.success('Спасибо за участие в опросе!');

        } catch (error) {
            console.error('❌ [Surveys] Ошибка отправки опроса:', error);
            toast.error(`Ошибка: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем опросы...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-neutral-900 mb-2">Опросы удовлетворенности</h1>
                        <p className="text-neutral-600">Помогите нам улучшить качество обучения на платформе</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                {/* Форма опроса */}
                {availableLesson ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-primary-100">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-neutral-900">Оцените ваш последний урок</h3>
                                    <p className="text-sm text-neutral-600">
                                        Урок: <span className="text-neutral-900 font-medium">{availableLesson.subject}</span>
                                        с <span className="text-neutral-900 font-medium">{availableLesson.tutorName}</span>
                                    </p>
                                    {availableLesson.completedAt && (
                                        <p className="text-xs text-neutral-500 mt-1">
                                            Завершен: {new Date(availableLesson.completedAt).toLocaleDateString('ru-RU')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitSurvey} className="space-y-6">
                            <div>
                                <Label className="mb-2 flex items-center justify-between">
                                    <span>Уровень удовлетворенности</span>
                                    <span className="text-primary-600 font-medium">{satisfactionLevel[0]}/5</span>
                                </Label>
                                <p className="text-sm text-neutral-600 mb-3">
                                    Насколько вы довольны качеством проведенного урока?
                                </p>
                                <Slider
                                    value={satisfactionLevel}
                                    onValueChange={setSatisfactionLevel}
                                    min={1}
                                    max={5}
                                    step={1}
                                    className="mt-2"
                                    disabled={submitting}
                                />
                                <div className="flex justify-between mt-2 text-sm text-neutral-500">
                                    <span className="text-red-500">Очень недоволен</span>
                                    <span className="text-green-500">Очень доволен</span>
                                </div>
                            </div>

                            <div>
                                <Label className="mb-2 flex items-center justify-between">
                                    <span>Прогресс знаний</span>
                                    <span className="text-accent-600 font-medium">{knowledgeGrowth[0]}/5</span>
                                </Label>
                                <p className="text-sm text-neutral-600 mb-3">
                                    Насколько вырос уровень ваших знаний после урока?
                                </p>
                                <Slider
                                    value={knowledgeGrowth}
                                    onValueChange={setKnowledgeGrowth}
                                    min={1}
                                    max={5}
                                    step={1}
                                    className="mt-2"
                                    disabled={submitting}
                                />
                                <div className="flex justify-between mt-2 text-sm text-neutral-500">
                                    <span className="text-red-500">Не вырос</span>
                                    <span className="text-green-500">Значительно вырос</span>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="survey-comments">Дополнительные комментарии (опционально)</Label>
                                <Textarea
                                    id="survey-comments"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Расскажите подробнее о своем опыте, что понравилось, что можно улучшить..."
                                    rows={5}
                                    className="mt-1"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Отправка...' : 'Отправить опрос'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSatisfactionLevel([3]);
                                        setKnowledgeGrowth([3]);
                                        setComments('');
                                    }}
                                    disabled={submitting}
                                    className="flex-1"
                                >
                                    Очистить
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <EmptyState
                        title="Нет доступных опросов"
                        description="После завершения урока здесь появится опрос для оценки качества обучения"
                        animalType="fox"
                    />
                )}

                {/* Отправленные опросы */}
                {surveys.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-neutral-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Мои отправленные опросы ({surveys.length})
                            </h3>
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="text-sm text-primary-600 hover:underline disabled:opacity-50"
                            >
                                Обновить
                            </button>
                        </div>

                        <div className="space-y-4">
                            {surveys.map(survey => (
                                <div
                                    key={survey.id}
                                    className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow border border-neutral-200 hover:border-primary-200 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                        <div>
                                            <p className="font-medium text-neutral-900">
                                                {survey.subject} с {survey.tutorName}
                                            </p>
                                            <p className="text-sm text-neutral-500 mt-1">
                                                Отправлено: {survey.date}
                                            </p>
                                        </div>

                                        <div className="flex gap-4 text-sm">
                                            <div className="text-center">
                                                <div className="text-xs text-neutral-500">Удовлетворение</div>
                                                <div className={`text-lg font-semibold ${
                                                    survey.satisfactionLevel >= 4 ? 'text-green-600' :
                                                        survey.satisfactionLevel >= 3 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                }`}>
                                                    {survey.satisfactionLevel}/5
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-neutral-500">Прогресс</div>
                                                <div className={`text-lg font-semibold ${
                                                    survey.knowledgeGrowth >= 4 ? 'text-green-600' :
                                                        survey.knowledgeGrowth >= 3 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                }`}>
                                                    {survey.knowledgeGrowth}/5
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {survey.comments && (
                                        <div className="mt-3 pt-3 border-t border-neutral-100">
                                            <p className="text-sm text-neutral-700">{survey.comments}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                <p className="font-medium">Доступный урок: {availableLesson ? 'Да' : 'Нет'}</p>
                                <p className="font-medium">Отправленных опросов: {surveys.length}</p>
                                <p>API URL: {API_URL}</p>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}