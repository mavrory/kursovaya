import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export function SchedulePage() {
    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

    const API_URL = import.meta.env?.VITE_API_URL ||
        import.meta.env?.REACT_APP_API_URL ||
        'http://localhost:5000/api';

    // Загрузка расписания
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Токен не найден. Пожалуйста, войдите заново.');
                }

                // Загружаем расписание репетитора
                const response = await fetch(`${API_URL}/tutors/schedule`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Ошибка загрузки расписания: ${response.status} - ${errorText}`);
                }

                const scheduleData = await response.json();

                // Форматируем данные расписания
                const formattedSchedule = Array.isArray(scheduleData)
                    ? scheduleData.map(item => {
                        // Нормализуем время - берем только HH:MM
                        let normalizedTime = '00:00';
                        if (item.time) {
                            if (typeof item.time === 'string') {
                                normalizedTime = item.time.substring(0, 5);
                            } else {
                                normalizedTime = item.time.toTimeString().split(' ')[0].substring(0, 5);
                            }
                        }

                        // Нормализуем дату (исправляем проблему с часовыми поясами)
                        let normalizedDate = '';
                        if (item.date) {
                            if (typeof item.date === 'string') {
                                // Если это строка в формате YYYY-MM-DD, используем как есть
                                if (/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
                                    normalizedDate = item.date;
                                } else {
                                    // Иначе парсим и используем локальное время
                                    const date = new Date(item.date);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    normalizedDate = `${year}-${month}-${day}`;
                                }
                            } else {
                                // Для объектов Date используем локальное время
                                const date = new Date(item.date);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                normalizedDate = `${year}-${month}-${day}`;
                            }
                        }

                        return {
                            id: item.schedule_id || item.id,
                            date: normalizedDate,
                            time: normalizedTime,
                            status: item.status || 'available',
                            studentName: item.student_name,
                            subject: item.subject_name,
                            duration: item.duration || 60,
                            isRecurring: item.is_recurring || false,
                            lessonId: item.lesson_id
                        };
                    })
                    : [];

                setSchedule(formattedSchedule);
                console.log('📅 [Schedule] Загружено слотов:', formattedSchedule.length);
                console.log('📅 [Schedule] Данные расписания:', formattedSchedule);

            } catch (err) {
                console.error('Ошибка загрузки расписания:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    // Группируем слоты по датам
    const scheduleByDate = schedule.reduce((acc, slot) => {
        if (!slot.date) return acc;

        if (!acc[slot.date]) {
            acc[slot.date] = [];
        }
        acc[slot.date].push(slot);
        return acc;
    }, {});

    // Получаем даты за следующую неделю для отображения
    const getWeekDates = () => {
        const dates = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr);
        }

        return dates;
    };

    const dates = getWeekDates();
    const selectedDateSlots = scheduleByDate[selectedDate] || [];

    // Сортировка слотов по времени
    const sortedSlots = [...selectedDateSlots].sort((a, b) => {
        const timeA = a.time.replace(':', '');
        const timeB = b.time.replace(':', '');
        return timeA - timeB;
    });

    // Генерация временных слотов для выбранной даты
    const generateTimeSlots = () => {
        const timeSlots = [];

        // Создаем мапу существующих слотов для быстрого поиска
        // Используем только время как ключ, так как дата уже выбрана
        const existingSlotsMap = new Map();
        sortedSlots.forEach(slot => {
            // Нормализуем время (HH:MM)
            const timeKey = slot.time ? slot.time.substring(0, 5) : '00:00';
            existingSlotsMap.set(timeKey, slot);
        });

        // Генерируем все слоты с 9:00 до 20:00
        for (let hour = 9; hour <= 20; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;

            // Если есть существующий слот для этого времени, используем его
            if (existingSlotsMap.has(time)) {
                const existingSlot = existingSlotsMap.get(time);
                // Приоритет: booked > blocked > available
                timeSlots.push({
                    ...existingSlot,
                    id: existingSlot.id || `${selectedDate}-${time}`,
                    date: selectedDate,
                    // Сохраняем статус из существующего слота
                    status: existingSlot.status || 'available'
                });
            } else {
                // Иначе создаем новый доступный слот
                timeSlots.push({
                    id: `${selectedDate}-${time}`,
                    date: selectedDate,
                    time: time,
                    status: 'available',
                    studentName: null,
                    subject: null
                });
            }
        }

        return timeSlots;
    };

    const timeSlots = generateTimeSlots();

    const bookedCount = timeSlots.filter(s => s.status === 'booked').length;
    const availableCount = timeSlots.filter(s => s.status === 'available').length;
    const blockedCount = timeSlots.filter(s => s.status === 'blocked').length;

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
            case 'booked':
                return 'bg-primary-100 text-primary-700 border-primary-200 cursor-default';
            case 'blocked':
                return 'bg-red-100 text-red-700 border-red-200 cursor-default';
            default:
                return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'available':
                return 'Свободно';
            case 'booked':
                return 'Занято';
            case 'blocked':
                return 'Недоступно';
            default:
                return status;
        }
    };

    const handleBlockTime = async () => {
        if (selectedTimeSlots.length === 0) {
            alert('Выберите хотя бы один временной слот для блокировки');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/tutors/schedule/block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: selectedDate,
                    time_slots: selectedTimeSlots
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Ошибка при блокировке времени: ${errorText}`;

                // Если ошибка 401 или 403, возможно токен истек или пользователь заблокирован
                if (response.status === 401 || response.status === 403) {
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error || errorMessage;
                        // Если токен недействителен, очищаем его и перенаправляем на логин
                        if (response.status === 401) {
                            localStorage.removeItem('token');
                            alert('Сессия истекла. Пожалуйста, войдите заново.');
                            window.location.href = '/';
                            return;
                        }
                    } catch {
                        // Если не удалось распарсить JSON, используем текст ошибки
                    }
                }

                throw new Error(errorMessage);
            }

            alert('Время успешно заблокировано');
            setBlockModalOpen(false);
            setSelectedTimeSlots([]);
            // Перезагружаем данные расписания
            const fetchSchedule = async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('Токен не найден. Пожалуйста, войдите заново.');
                    }

                    const response = await fetch(`${API_URL}/tutors/schedule`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Ошибка загрузки расписания: ${response.status} - ${errorText}`);
                    }

                    const scheduleData = await response.json();

                    // Форматируем данные расписания
                    const formattedSchedule = Array.isArray(scheduleData)
                        ? scheduleData.map(item => {
                            // Нормализуем время - берем только HH:MM
                            let normalizedTime = '00:00';
                            if (item.time) {
                                if (typeof item.time === 'string') {
                                    normalizedTime = item.time.substring(0, 5);
                                } else {
                                    normalizedTime = item.time.toTimeString().split(' ')[0].substring(0, 5);
                                }
                            }

                            // Нормализуем дату (исправляем проблему с часовыми поясами)
                            let normalizedDate = '';
                            if (item.date) {
                                if (typeof item.date === 'string') {
                                    // Если это строка в формате YYYY-MM-DD, используем как есть
                                    if (/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
                                        normalizedDate = item.date;
                                    } else {
                                        // Иначе парсим и используем локальное время
                                        const date = new Date(item.date);
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        normalizedDate = `${year}-${month}-${day}`;
                                    }
                                } else {
                                    // Для объектов Date используем локальное время
                                    const date = new Date(item.date);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    normalizedDate = `${year}-${month}-${day}`;
                                }
                            }

                            return {
                                id: item.schedule_id || item.id,
                                date: normalizedDate,
                                time: normalizedTime,
                                status: item.status || 'available',
                                studentName: item.student_name,
                                subject: item.subject_name,
                                duration: item.duration || 60,
                                isRecurring: item.is_recurring || false,
                                lessonId: item.lesson_id
                            };
                        })
                        : [];

                    setSchedule(formattedSchedule);
                } catch (err) {
                    console.error('Ошибка загрузки расписания:', err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            await fetchSchedule();

        } catch (err) {
            console.error('Ошибка блокировки времени:', err);
            alert(`Ошибка: ${err.message}`);
        }
    };

// количество слотов в день
    const SLOTS_PER_DAY = 12;
    const weeklyPossibleSlots = dates.length * SLOTS_PER_DAY;

// Фильтруем расписание, чтобы учесть только слоты на ближайшие 7 дней
    const weeklySchedule = schedule.filter(slot => dates.includes(slot.date));

// Расчет недельных счетчиков
    const weeklyBookedCount = weeklySchedule.filter(s => s.status === 'booked').length;
    const weeklyBlockedCount = weeklySchedule.filter(s => s.status === 'blocked').length;

// Расчет доступных слотов
    const weeklyUnavailableCount = weeklyBookedCount + weeklyBlockedCount;
    const weeklyAvailableCount = weeklyPossibleSlots - weeklyUnavailableCount;

// Расчет загруженности
    const weeklyOccupancy = weeklyPossibleSlots > 0
        ? Math.round((weeklyBookedCount / weeklyPossibleSlots) * 100)
        : 0;


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем расписание...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 mb-2 font-medium">Ошибка загрузки расписания</p>
                <p className="text-sm text-neutral-600 mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-neutral-900 mb-2">Мое расписание</h1>
                    <p className="text-neutral-600">Управляй своим временем и доступностью</p>
                </div>

                <Button
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
                    onClick={() => {
                        setBlockModalOpen(true);
                        // Инициализируем пустым массивом - пользователь сам выберет слоты
                        setSelectedTimeSlots([]);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Заблокировать время
                </Button>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Calendar Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 sticky top-6">
                        <h3 className="text-neutral-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Выбери дату
                        </h3>
                        <div className="space-y-2">
                            {dates.map(date => {
                                const dateObj = new Date(date);
                                const isSelected = date === selectedDate;
                                const daySlots = scheduleByDate[date] || [];
                                const dayBooked = daySlots.filter(s => s.status === 'booked').length;

                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-primary-200 to-secondary-200 border-primary-300 shadow-md'
                                                : 'bg-white border-primary-100 hover:bg-primary-50'
                                        }`}
                                    >
                                        <p className="text-sm text-neutral-900 mb-1">
                                            {dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })}
                                        </p>
                                        <p className={`text-lg ${isSelected ? 'text-primary-700' : 'text-neutral-800'}`}>
                                            {dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                        </p>
                                        {dayBooked > 0 && (
                                            <p className="text-xs text-primary-600 mt-1">
                                                {dayBooked} {dayBooked === 1 ? 'урок' : 'уроков'}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Schedule Grid */}
                <div className="lg:col-span-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-neutral-900">
                                {new Date(selectedDate).toLocaleDateString('ru-RU', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </h3>
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <span className="text-neutral-600">Свободно: {availableCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary-400"></div>
                                    <span className="text-neutral-600">Занято: {bookedCount}</span>
                                </div>
                                {blockedCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <span className="text-neutral-600">Заблокировано: {blockedCount}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {timeSlots.map(slot => (
                                <div
                                    key={slot.id || `${slot.date}-${slot.time}`}
                                    className={`p-4 rounded-xl border transition-all ${getStatusColor(slot.status)}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">{slot.time}</span>
                                    </div>
                                    {slot.status === 'booked' && slot.studentName ? (
                                        <div>
                                            <p className="text-xs mb-1 font-medium">{slot.studentName}</p>
                                            <p className="text-xs opacity-80">{slot.subject}</p>
                                            {slot.duration && (
                                                <p className="text-xs opacity-60 mt-1">{slot.duration} мин</p>
                                            )}
                                        </div>
                                    ) : (
                                        <Badge className={`${getStatusColor(slot.status)} border-0 text-xs`}>
                                            {getStatusLabel(slot.status)}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Schedule Stats */}
                    {/*<div className="grid md:grid-cols-3 gap-4">*/}
                    {/*    <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl p-6 border border-primary-200">*/}
                    {/*        <p className="text-sm text-neutral-700 mb-1">Уроков на этой неделе</p>*/}
                    {/*        <p className="text-3xl text-primary-600">*/}
                    {/*            {schedule.filter(s => s.status === 'booked').length}*/}
                    {/*        </p>*/}
                    {/*    </div>*/}

                    {/*    <div className="bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl p-6 border border-accent-200">*/}
                    {/*        <p className="text-sm text-neutral-700 mb-1">Свободных слотов</p>*/}
                    {/*        <p className="text-3xl text-accent-600">*/}
                    {/*            {schedule.filter(s => s.status === 'available').length}*/}
                    {/*        </p>*/}
                    {/*    </div>*/}

                    {/*    <div className="bg-gradient-to-br from-secondary-100 to-accent-100 rounded-xl p-6 border border-secondary-200">*/}
                    {/*        <p className="text-sm text-neutral-700 mb-1">Загруженность</p>*/}
                    {/*        <p className="text-3xl text-secondary-600">*/}
                    {/*            {schedule.length > 0*/}
                    {/*                ? `${Math.round((schedule.filter(s => s.status === 'booked').length / schedule.length) * 100)}%`*/}
                    {/*                : '0%'*/}
                    {/*            }*/}
                    {/*        </p>*/}
                    {/*    </div>*/}
                    {/*</div>*/}


                    {/* Schedule Stats */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl p-6 border border-primary-200">
                            <p className="text-sm text-neutral-700 mb-1">Уроков на этой неделе</p>
                            <p className="text-3xl text-primary-600">
                                {weeklyBookedCount}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl p-6 border border-accent-200">
                            <p className="text-sm text-neutral-700 mb-1">Свободных слотов</p>
                            <p className="text-3xl text-accent-600">
                                {weeklyAvailableCount}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-secondary-100 to-accent-100 rounded-xl p-6 border border-secondary-200">
                            <p className="text-sm text-neutral-700 mb-1">Загруженность</p>
                            <p className="text-3xl text-secondary-600">
                                {weeklyOccupancy}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно блокировки времени */}
            {blockModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-neutral-900 mb-4">Заблокировать время</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            Выберите временные слоты для блокировки на {new Date(selectedDate).toLocaleDateString('ru-RU')}
                        </p>
                        <p className="text-xs text-neutral-500 mb-4">
                            Выбрано: {selectedTimeSlots.length} слотов
                        </p>

                        <div className="space-y-3 mb-6">
                            {timeSlots
                                .filter(slot => slot.status === 'available')
                                .map(slot => (
                                    <label key={slot.time} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                                        <input
                                            type="checkbox"
                                            value={slot.time}
                                            checked={selectedTimeSlots.includes(slot.time)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTimeSlots([...selectedTimeSlots, slot.time]);
                                                } else {
                                                    setSelectedTimeSlots(selectedTimeSlots.filter(t => t !== slot.time));
                                                }
                                            }}
                                            className="w-4 h-4 text-primary-600 rounded"
                                        />
                                        <span className="text-sm">{slot.time}</span>
                                    </label>
                                ))
                            }
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleBlockTime}
                                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
                                disabled={selectedTimeSlots.length === 0}
                            >
                                Заблокировать ({selectedTimeSlots.length})
                            </Button>
                            <Button
                                onClick={() => setBlockModalOpen(false)}
                                className="flex-1 border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                            >
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
