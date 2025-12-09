import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, X, Check, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { TutorCard } from '../components/TutorCard';
import { Slider } from '../components/ui/slider';

export function CatalogPage({ onViewTutorDetails }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [priceRange, setPriceRange] = useState([1000, 3000]);
    const [tutors, setTutors] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState('');
    const [filterExpanded, setFilterExpanded] = useState(true);
    const [notification, setNotification] = useState(null);

    // Функция для показа уведомлений
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, id: Date.now() });

        setTimeout(() => {
            setNotification(prev => prev?.id === Date.now() ? null : prev);
        }, 3000);
    };

    const hideNotification = () => {
        setNotification(null);
    };

    const API_URL = import.meta.env?.VITE_API_URL ||
        import.meta.env?.REACT_APP_API_URL ||
        'http://localhost:5000/api';

    useEffect(() => {
        loadCatalogData();
    }, []);

    const loadCatalogData = async () => {
        setLoading(true);
        setLoadingError('');
        console.log('📦 [Catalog] Начинаем загрузку каталога...');

        try {
            const token = localStorage.getItem('token');

            // Параллельно загружаем репетиторов и предметы
            const [tutorsResponse, subjectsResponse] = await Promise.all([
                fetch(`${API_URL}/tutors`, {
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` }),
                        'Content-Type': 'application/json'
                    }
                }).catch(err => {
                    console.error('❌ [Catalog] Ошибка загрузки репетиторов:', err);
                    throw new Error('Не удалось подключиться к серверу');
                }),

                fetch(`${API_URL}/subjects`, {
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` }),
                        'Content-Type': 'application/json'
                    }
                }).catch(() => {
                    console.warn('⚠️ [Catalog] Ошибка загрузки предметов, используем пустой список');
                    return { ok: true, json: () => [] };
                })
            ]);

            // Обрабатываем ответ репетиторов
            if (!tutorsResponse.ok) {
                throw new Error(`Ошибка сервера: ${tutorsResponse.status}`);
            }

            const tutorsData = await tutorsResponse.json();
            console.log('✅ [Catalog] Данные репетиторов получены:', tutorsData);

            // Обрабатываем ответ предметов
            let subjectsData = [];
            if (subjectsResponse.ok) {
                subjectsData = await subjectsResponse.json();
                console.log('✅ [Catalog] Данные предметов получены:', subjectsData);
            }

            // Преобразуем данные
            const processedTutors = processTutorsData(tutorsData);
            const processedSubjects = processSubjectsData(subjectsData, processedTutors);

            setTutors(processedTutors);
            setSubjects(processedSubjects);

            // ОБНОВЛЕННЫЙ КОД: Правильный расчет диапазона цен
            if (processedTutors.length > 0) {
                const prices = processedTutors.map(t => t.pricePerHour).filter(price => !isNaN(price) && price > 0);

                if (prices.length > 0) {
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const roundedMin = Math.floor(minPrice / 100) * 100; // Округляем до сотен
                    const roundedMax = Math.ceil(maxPrice / 100) * 100;

                    setPriceRange([roundedMin, roundedMax]);
                    console.log('💰 [Catalog] Обновлен диапазон цен:', [roundedMin, roundedMax], 'Исходные:', prices);
                } else {
                    setPriceRange([1000, 3000]);
                }
            }

            showNotification(`Загружено ${processedTutors.length} репетиторов`, 'success');

        } catch (error) {
            console.error('❌ [Catalog] Ошибка загрузки:', error);
            setLoadingError(error.message || 'Не удалось загрузить каталог');
            showNotification(error.message || 'Ошибка загрузки каталога', 'error');

            setTutors([]);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    // Преобразование данных репетиторов
    const processTutorsData = (data) => {
        console.log('🔧 [Catalog] Обработка данных репетиторов:', data);

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(tutor => {
            const price = Number(tutor.price_per_hour) || Number(tutor.pricePerHour) || 1500;
            const experience = Number(tutor.experience) || 0;
            const rating = Number(tutor.rating_avg) || Number(tutor.rating) || 4.5;

            return {
                id: tutor.user_id || tutor.id,
                name: tutor.name || 'Без имени',
                email: tutor.email || '',
                bio: tutor.bio ||
                    tutor.description ||
                    (experience > 0 ? `Опыт преподавания: ${experience} лет` : 'Опытный репетитор'),
                subjects: tutor.subject_name ? [tutor.subject_name] :
                    ['Не указан'],
                pricePerHour: price,
                rating: rating,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name || 'Репетитор')}&background=random`,
                experienceYears: experience, // Вот это поле передается в TutorCard
                reviewCount: tutor.review_count || 0, // Добавляем количество отзывов
                _rawData: tutor
            };
        });
    };

    // Преобразование данных предметов
    const processSubjectsData = (data, tutorsData) => {
        console.log('🔧 [Catalog] Обработка данных предметов:', data);

        if (Array.isArray(data) && data.length > 0) {
            return data.map(subject => ({
                id: subject.subject_id || subject.id,
                name: subject.name || 'Неизвестный предмет',
                icon: getSubjectIcon(subject.name),
            }));
        }

        // Собираем уникальные предметы из репетиторов
        const subjectsFromTutors = [...new Set(
            tutorsData.flatMap(t => t.subjects)
        )].filter(s => s !== 'Не указан');

        return subjectsFromTutors.map((name, index) => ({
            id: index + 1,
            name: name,
            icon: getSubjectIcon(name)
        }));
    };

    const getSubjectIcon = (subjectName) => {
        const iconMap = {
            'Математика': '∫',
            'Физика': '⚛',
            'Химия': '⚗',
            'Английский язык': '🇬🇧',
            'Русский язык': '📖',
            'История': '📜',
            'Биология': '🧬',
            'Информатика': '💻',
        };

        const foundKey = Object.keys(iconMap).find(key =>
            subjectName.toLowerCase().includes(key.toLowerCase())
        );

        return foundKey ? iconMap[foundKey] : '📚';
    };

    // Фильтрация
    const filteredTutors = tutors.filter(tutor => {
        const searchLower = searchQuery.toLowerCase().trim();

        // Проверка поиска
        const nameMatch = tutor.name.toLowerCase().includes(searchLower);
        const bioMatch = tutor.bio.toLowerCase().includes(searchLower);
        const subjectsMatch = tutor.subjects.some(subject =>
            subject.toLowerCase().includes(searchLower)
        );
        const matchesSearch = searchLower === '' || nameMatch || bioMatch || subjectsMatch;

        // Проверка предмета
        const matchesSubject = selectedSubject === 'all' ||
            tutor.subjects.includes(selectedSubject);

        // Проверка цены
        const matchesPrice = tutor.pricePerHour >= priceRange[0] &&
            tutor.pricePerHour <= priceRange[1];

        return matchesSearch && matchesSubject && matchesPrice;
    });

    // Логируем результат фильтрации
    useEffect(() => {
        if (tutors.length > 0) {
            console.log('🎯 [Filter] Результат фильтрации:', {
                totalTutors: tutors.length,
                filteredTutors: filteredTutors.length,
                filters: {
                    searchQuery,
                    selectedSubject,
                    priceRange
                }
            });
        }
    }, [filteredTutors, tutors.length, searchQuery, selectedSubject, priceRange]);

    const handleResetFilters = () => {
        console.log('🔄 [Catalog] Сброс фильтров');
        setSearchQuery('');
        setSelectedSubject('all');
        if (tutors.length > 0) {
            const prices = tutors.map(t => t.pricePerHour).filter(price => !isNaN(price) && price > 0);
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const roundedMin = Math.floor(minPrice / 100) * 100;
                const roundedMax = Math.ceil(maxPrice / 100) * 100;
                setPriceRange([roundedMin, roundedMax]);
            }
        }
        showNotification('Фильтры сброшены', 'success');
    };

    const handleRefresh = () => {
        console.log('🔄 [Catalog] Принудительное обновление данных');
        loadCatalogData();
    };

    const handleViewTutorDetails = (tutor) => {
        console.log('👁️ [Catalog] Просмотр репетитора:', tutor.name);
        // Исправлено: передаем только ID репетитора, а не весь объект
        onViewTutorDetails(tutor.id);
    };

    const handlePriceChange = (newRange) => {
        console.log('💰 [Catalog] Изменен диапазон цен:', newRange);
        setPriceRange(newRange);
    };

    // Рассчитываем min/max для слайдера
    const calculatePriceRange = () => {
        if (tutors.length === 0) return { min: 500, max: 5000 };

        const prices = tutors.map(t => t.pricePerHour).filter(price => !isNaN(price) && price > 0);
        if (prices.length === 0) return { min: 500, max: 5000 };

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const roundedMin = Math.floor(minPrice / 100) * 100;
        const roundedMax = Math.ceil(maxPrice / 100) * 100;

        return { min: roundedMin, max: roundedMax };
    };

    const priceLimits = calculatePriceRange();

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Загружаем каталог репетиторов...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            {/* Уведомления */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-right duration-300 ${
                    notification.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <div className="flex items-start gap-3">
                        {notification.type === 'success' ? (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-medium">{notification.message}</p>
                        </div>
                        <button onClick={hideNotification}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Заголовок */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-neutral-900 mb-2">Каталог репетиторов</h1>
                        <p className="text-neutral-600">Найди идеального репетитора для твоих целей</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Обновить
                        </button>

                        <button
                            onClick={() => setFilterExpanded(!filterExpanded)}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-50 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            {filterExpanded ? 'Скрыть фильтры' : 'Показать фильтры'}
                        </button>
                    </div>
                </div>

                {/* Информация */}
                {loadingError ? (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-medium">Ошибка загрузки</p>
                        <p className="text-red-600 text-sm mt-1">{loadingError}</p>
                    </div>
                ) : (
                    <div className="mt-4 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Загружено репетиторов: {tutors.length}
            </span>
                        <span className="mx-3">•</span>
                        <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Доступно предметов: {subjects.length}
            </span>
                        <span className="mx-3">•</span>
                        <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Найдено: {filteredTutors.length}
            </span>
                    </div>
                )}
            </div>

            {/* Фильтры */}
            {filterExpanded && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-primary-100">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                        {/* Поиск */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Поиск репетитора
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <Input
                                    type="text"
                                    placeholder="Имя, предмет, описание..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Предмет */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Предмет
                            </label>
                            <Select
                                value={selectedSubject}
                                onValueChange={setSelectedSubject}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Все предметы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все предметы</SelectItem>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.name}>
                                            <span className="mr-2">{subject.icon}</span>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Цена - ИСПРАВЛЕННЫЙ БЛОК */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Цена за час: {priceRange[0]} - {priceRange[1]} ₽
                            </label>
                            <Slider
                                value={priceRange}
                                onValueChange={handlePriceChange}
                                min={priceLimits.min}
                                max={priceLimits.max}
                                step={100}
                                className="mt-4"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 mt-2">
                                <span>{priceLimits.min} ₽</span>
                                <span>{priceLimits.max} ₽</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                        <div>
                            <p className="text-sm text-neutral-600">
                                Найдено: <span className="text-neutral-900 font-medium">{filteredTutors.length}</span> репетиторов
                            </p>
                        </div>

                        <button
                            onClick={handleResetFilters}
                            className="px-4 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                </div>
            )}

            {/* Репетиторы */}
            <div className="mb-8">
                {filteredTutors.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTutors.map(tutor => (
                            <TutorCard
                                key={tutor.id}
                                tutor={tutor}
                                onViewDetails={() => handleViewTutorDetails(tutor)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary-100">
                        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-neutral-100 rounded-full">
                            <Search className="w-10 h-10 text-neutral-400" />
                        </div>
                        <h3 className="text-xl font-medium text-neutral-900 mb-3">
                            {tutors.length === 0 ? 'Нет репетиторов' : 'Репетиторы не найдены'}
                        </h3>
                        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                            {tutors.length === 0
                                ? 'В каталоге пока нет репетиторов.'
                                : 'Попробуйте изменить параметры поиска или сбросить фильтры.'}
                        </p>
                        {tutors.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={handleResetFilters}
                                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Сбросить все фильтры
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Отладка */}
            <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-neutral-700">
                        Отладочная информация (развернуть)
                    </summary>
                    <div className="mt-4 space-y-4">
                        <div>
                            <p className="font-medium mb-2">Данные репетиторов:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tutors.map(tutor => (
                                    <div key={tutor.id} className="p-3 bg-white rounded border">
                                        <p className="font-medium">{tutor.name}</p>
                                        <p className="text-sm text-neutral-600">ID: {tutor.id}</p>
                                        <p className="text-sm text-neutral-600">Предмет: {tutor.subjects.join(', ')}</p>
                                        <p className="text-sm text-neutral-600">Цена: {tutor.pricePerHour} ₽</p>
                                        <p className="text-sm text-neutral-600">Опыт: {tutor.experienceYears} лет</p>
                                        <p className="text-sm text-neutral-600">Отзывы: {tutor.reviewCount}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="font-medium mb-2">Фильтры:</p>
                            <div className="p-3 bg-white rounded border">
                                <p>Поиск: "{searchQuery}"</p>
                                <p>Предмет: {selectedSubject}</p>
                                <p>Диапазон цен: {priceRange[0]} - {priceRange[1]} ₽</p>
                                <p>Доступный диапазон: {priceLimits.min} - {priceLimits.max} ₽</p>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
}