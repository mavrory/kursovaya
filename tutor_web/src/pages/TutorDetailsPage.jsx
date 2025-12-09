import { useState, useEffect } from 'react';
import { Star, Clock, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ReviewCard } from '../components/ReviewCard';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-hot-toast';

export function TutorDetailsPage({ tutorId, onNavigate }) {
    const [tutor, setTutor] = useState(null);
    const [tutorReviews, setTutorReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const API_URL = import.meta.env?.VITE_API_URL ||
        import.meta.env?.REACT_APP_API_URL ||
        'http://localhost:5000/api';

    useEffect(() => {
        // Нормализуем tutorId - может быть число или строка
        const normalizedTutorId = typeof tutorId === 'object' ? (tutorId?.id || tutorId?.user_id || tutorId) : tutorId;
        if (normalizedTutorId) {
            console.log('📋 [TutorDetails] Загрузка данных репетитора с ID:', normalizedTutorId);
            loadTutorData(normalizedTutorId);
        } else {
            console.error('❌ [TutorDetails] Не передан ID репетитора:', tutorId);
            setError('ID репетитора не указан');
            setLoading(false);
        }
    }, [tutorId]);

    // Загрузка доступных слотов при изменении даты
    useEffect(() => {
        if (showRequestForm && tutor && selectedDate) {
            loadAvailableSlots();
        }
    }, [showRequestForm, selectedDate, tutor]);

    const loadAvailableSlots = async () => {
        if (!tutor || !tutor.id) return;
        
        setLoadingSlots(true);
        try {
            // Загружаем публичное расписание репетитора (доступно без аутентификации)
            const response = await fetch(`${API_URL}/tutors/${tutor.id}/schedule`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const scheduleData = await response.json();
                // Фильтруем слоты для выбранной даты
                const dateSlots = Array.isArray(scheduleData)
                    ? scheduleData.filter(slot => {
                        const slotDate = slot.date ? (typeof slot.date === 'string' ? slot.date.split('T')[0] : new Date(slot.date).toISOString().split('T')[0]) : '';
                        return slotDate === selectedDate && (slot.status === 'available' || slot.status === 'booked');
                    })
                    : [];
                
                // Генерируем все возможные слоты с 9:00 до 20:00
                const allSlots = [];
                for (let hour = 9; hour <= 20; hour++) {
                    const time = `${hour.toString().padStart(2, '0')}:00`;
                    const existingSlot = dateSlots.find(s => {
                        const slotTime = s.time ? s.time.substring(0, 5) : '00:00';
                        return slotTime === time;
                    });
                    
                    if (!existingSlot || existingSlot.status === 'available') {
                        allSlots.push({
                            time: time,
                            available: !existingSlot || existingSlot.status === 'available'
                        });
                    }
                }
                
                setAvailableSlots(allSlots);
            }
        } catch (err) {
            console.error('Ошибка загрузки расписания:', err);
            // Если не удалось загрузить, показываем все слоты как доступные
            const defaultSlots = [];
            for (let hour = 9; hour <= 20; hour++) {
                defaultSlots.push({
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    available: true
                });
            }
            setAvailableSlots(defaultSlots);
        } finally {
            setLoadingSlots(false);
        }
    };

    const getSubjectIdByName = async (subjectName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/subjects`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const subjects = await response.json();
                const subject = Array.isArray(subjects)
                    ? subjects.find(s => s.name === subjectName || (s.toJSON && s.toJSON().name === subjectName))
                    : null;
                return subject ? (subject.subject_id || subject.id) : null;
            }
            return null;
        } catch (err) {
            console.error('Ошибка получения предмета:', err);
            return null;
        }
    };

    const loadTutorData = async (id = null) => {
        setLoading(true);
        setError(null);

        // Используем переданный ID или tutorId из пропсов
        const tutorIdToUse = id || tutorId;
        
        // Нормализуем ID
        const normalizedId = typeof tutorIdToUse === 'object' 
            ? (tutorIdToUse?.id || tutorIdToUse?.user_id || tutorIdToUse) 
            : tutorIdToUse;

        if (!normalizedId) {
            setError('ID репетитора не указан');
            setLoading(false);
            return;
        }

        console.log('📋 [TutorDetails] Загрузка данных для репетитора ID:', normalizedId);

        try {
            const token = localStorage.getItem('token');

            // Параллельно загружаем профиль репетитора и отзывы
            const [tutorResponse, reviewsResponse] = await Promise.all([
                fetch(`${API_URL}/tutors/${normalizedId}`, {
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` }),
                        'Content-Type': 'application/json'
                    }
                }).catch(err => {
                    console.error('Ошибка запроса профиля репетитора:', err);
                    throw new Error('Не удалось подключиться к серверу');
                }),
                fetch(`${API_URL}/reviews/tutor/${normalizedId}`, {
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` }),
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (!tutorResponse.ok) {
                const errorText = await tutorResponse.text();
                let errorMessage = `Ошибка загрузки профиля: ${tutorResponse.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // Если не удалось распарсить JSON, используем текст ошибки
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const tutorData = await tutorResponse.json();
            const tutorProfile = tutorData.data || tutorData;

            // Проверяем, что репетитор найден
            if (!tutorProfile || (!tutorProfile.user_id && !tutorProfile.tutor_id && !tutorProfile.id)) {
                throw new Error('Репетитор не найден');
            }

            console.log('✅ [TutorDetails] Загружен профиль репетитора:', tutorProfile);

            // Обрабатываем отзывы
            let reviewsData = [];
            if (reviewsResponse.ok) {
                const reviewsResult = await reviewsResponse.json();
                reviewsData = reviewsResult.data?.reviews || reviewsResult.reviews || reviewsResult || [];
            }

            // Форматируем данные репетитора
            const formattedTutor = {
                id: tutorProfile.user_id || tutorProfile.tutor_id || tutorProfile.id,
                name: tutorProfile.name || 'Без имени',
                email: tutorProfile.email || '',
                bio: tutorProfile.bio || tutorProfile.description || 'Опытный репетитор',
                subjects: tutorProfile.subject_name ? [tutorProfile.subject_name] :
                    (tutorProfile.subjects || ['Не указан']),
                pricePerHour: Number(tutorProfile.price_per_hour) || 1500,
                ratingAvg: Number(tutorProfile.rating_avg) || Number(tutorProfile.rating) || 4.5,
                experience: Number(tutorProfile.experience) || 0,
                reviewCount: reviewsData.length || 0,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorProfile.name || 'Репетитор')}&background=random`
            };

            // Форматируем отзывы
            const formattedReviews = reviewsData.map(review => ({
                id: review.review_id || review.id,
                tutorId: review.tutor_id || normalizedId,
                studentName: review.student_name || 'Анонимный',
                rating: Number(review.rating) || 5,
                comment: review.comment || '',
                createdAt: review.date_posted || review.created_at
            }));

            setTutor(formattedTutor);
            setTutorReviews(formattedReviews);

        } catch (err) {
            console.error('Ошибка загрузки данных репетитора:', err);
            setError(err.message);
            toast.error(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем данные репетитора...</p>
                </div>
            </div>
        );
    }

    if (error || !tutor) {
        return (
            <div>
                <EmptyState
                    title="Репетитор не найден"
                    description={error || "Такого репетитора не существует"}
                    animalType="raccoon"
                />
                <div className="text-center">
                    <Button onClick={() => onNavigate('catalog')} variant="outline">
                        Вернуться к каталогу
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Button
                onClick={() => onNavigate('catalog')}
                variant="ghost"
                className="mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Назад к каталогу
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-primary-100 mb-6">
                        <div className="flex items-start gap-6 mb-6">
                            <img
                                src={tutor.avatar}
                                alt={tutor.name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                            />
                            <div className="flex-1">
                                <h2 className="text-neutral-900 mb-2">{tutor.name}</h2>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-lg text-neutral-900">{tutor.ratingAvg.toFixed(1)}</span>
                                    </div>
                                    <span className="text-neutral-500">({tutor.reviewCount} отзывов)</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {tutor.subjects.map((subject, index) => (
                                        <Badge key={index} className="bg-secondary-100 text-secondary-700 border-secondary-200">
                                            {subject}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-6 text-neutral-600">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        <span>{tutor.experience} лет опыта</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary-600">
                                        <DollarSign className="w-5 h-5" />
                                        <span className="text-lg">{tutor.pricePerHour} ₽/час</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-primary-100 pt-6">
                            <h4 className="text-neutral-900 mb-3">О репетиторе</h4>
                            <p className="text-neutral-700">{tutor.bio}</p>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-primary-100">
                        <h3 className="text-neutral-900 mb-6">Отзывы учеников</h3>
                        {tutorReviews.length > 0 ? (
                            <div className="space-y-4">
                                {tutorReviews.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Отзывов пока нет"
                                description="Будь первым, кто оставит отзыв об этом репетиторе"
                                animalType="cat"
                            />
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-6 shadow-lg border border-primary-200 sticky top-6">
                        <h4 className="text-neutral-900 mb-4">Забронировать урок</h4>
                        
                        {!showRequestForm ? (
                            <>
                                <div className="space-y-4 mb-6">
                                    <div className="bg-white/80 rounded-lg p-4">
                                        <p className="text-sm text-neutral-700 mb-1">Стоимость урока</p>
                                        <p className="text-2xl text-primary-600">{tutor.pricePerHour} ₽</p>
                                        <p className="text-xs text-neutral-500">за 60 минут</p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white mb-3"
                                    onClick={() => {
                                        const token = localStorage.getItem('token');
                                        if (!token) {
                                            toast.error('Необходимо войти в систему для отправки запроса');
                                            onNavigate('login');
                                            return;
                                        }
                                        setShowRequestForm(true);
                                    }}
                                >
                                    Запросить урок
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-white/80 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Дата урока</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setSelectedTime('');
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {loadingSlots ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                                        <p className="text-sm text-neutral-600 mt-2">Загрузка доступного времени...</p>
                                    </div>
                                ) : (
                                    <div className="bg-white/80 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Время урока</label>
                                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    onClick={() => setSelectedTime(slot.time)}
                                                    disabled={!slot.available}
                                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                                        selectedTime === slot.time
                                                            ? 'bg-primary-600 text-white border-primary-600'
                                                            : slot.available
                                                            ? 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500 hover:bg-primary-50'
                                                            : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                        {availableSlots.length === 0 && (
                                            <p className="text-sm text-neutral-500 text-center py-2">Нет доступного времени на эту дату</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
                                        onClick={async () => {
                                            if (!selectedDate || !selectedTime) {
                                                toast.error('Выберите дату и время');
                                                return;
                                            }

                                            try {
                                                const token = localStorage.getItem('token');
                                                if (!token) {
                                                    toast.error('Необходимо войти в систему');
                                                    onNavigate('login');
                                                    return;
                                                }

                                                // Получаем subject_id из предметов репетитора
                                                const subjectId = tutor.subjects && tutor.subjects.length > 0
                                                    ? await getSubjectIdByName(tutor.subjects[0])
                                                    : null;

                                                // Формируем дату и время
                                                const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
                                                if (scheduledDateTime < new Date()) {
                                                    toast.error('Выберите будущую дату и время');
                                                    return;
                                                }

                                                // Создаем запрос на урок
                                                const response = await fetch(`${API_URL}/lesson-requests`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({
                                                        tutor_id: tutor.id,
                                                        subject_id: subjectId,
                                                        scheduled_time: scheduledDateTime.toISOString(),
                                                        message: `Запрос на урок с ${tutor.name}`
                                                    })
                                                });

                                                if (!response.ok) {
                                                    const errorData = await response.json();
                                                    throw new Error(errorData.error || 'Ошибка при создании запроса');
                                                }

                                                toast.success('Запрос на урок отправлен!');
                                                setShowRequestForm(false);
                                                setSelectedTime('');
                                            } catch (err) {
                                                console.error('Ошибка создания запроса:', err);
                                                toast.error(`Ошибка: ${err.message}`);
                                            }
                                        }}
                                        disabled={!selectedDate || !selectedTime || loadingSlots}
                                    >
                                        Отправить запрос
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowRequestForm(false);
                                            setSelectedTime('');
                                        }}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-primary-200">
                            <p className="text-xs text-neutral-600 text-center">
                                💡 Первое занятие можно провести бесплатно для знакомства
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}