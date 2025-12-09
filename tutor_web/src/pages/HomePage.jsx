import { useState, useEffect } from 'react';
import { ArrowRight, Star, Users, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TutorCard } from '../components/TutorCard';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export function HomePage({ onNavigate, onViewTutorDetails }) {
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [stats, setStats] = useState({
    tutorCount: 0,
    subjectCount: 0,
    avgRating: 4.8,
    progressRate: 85
  });
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env?.VITE_API_URL ||
      import.meta.env?.REACT_APP_API_URL ||
      'http://localhost:5000/api';

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Параллельно загружаем репетиторов и предметы
      const [tutorsResponse, subjectsResponse] = await Promise.all([
        fetch(`${API_URL}/tutors`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/subjects`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json'
          }
        })
      ]);

      let tutorsData = [];
      if (tutorsResponse.ok) {
        tutorsData = await tutorsResponse.json();
      }

      let subjectsData = [];
      if (subjectsResponse.ok) {
        subjectsData = await subjectsResponse.json();
      }

      // Форматируем репетиторов
      const formattedTutors = Array.isArray(tutorsData) ? tutorsData.slice(0, 3).map(tutor => ({
        id: tutor.user_id || tutor.id,
        name: tutor.name || 'Без имени',
        subjects: tutor.subject_name ? [tutor.subject_name] : ['Не указан'],
        pricePerHour: Number(tutor.price_per_hour) || 1500,
        rating: Number(tutor.rating_avg) || 4.5,
        experienceYears: Number(tutor.experience) || 0,
        reviewCount: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name || 'Репетитор')}&background=random`
      })) : [];

      setFeaturedTutors(formattedTutors);
      setStats({
        tutorCount: tutorsData.length || 0,
        subjectCount: Array.isArray(subjectsData) ? subjectsData.length : 0,
        avgRating: 4.8,
        progressRate: 85
      });

    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 py-20 px-8 rounded-3xl mb-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-primary-600 mb-4">
              Найди своего идеального репетитора
            </h1>
            <p className="text-xl text-neutral-700 mb-8">
              Персонализированное обучение с лучшими преподавателями. Более 100 квалифицированных репетиторов готовы помочь тебе достичь целей!
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => onNavigate('catalog')}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8"
              >
                Найти репетитора <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={() => onNavigate('login')}
                variant="outline"
                className="border-primary-300 text-primary-600 hover:bg-primary-50"
              >
                Войти
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-300/30 to-secondary-300/30 rounded-full blur-3xl"></div>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1762330910399-95caa55acf04?w=600"
              alt="Online learning"
              className="relative z-10 rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto mb-16 px-8">
        <h2 className="text-center text-neutral-900 mb-12">Почему выбирают TutorPaw?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-primary-100 shadow-md hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-secondary-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-neutral-900 mb-2">{stats.tutorCount}+ репетиторов</h4>
            <p className="text-sm text-neutral-600">Квалифицированные преподаватели по всем предметам</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-accent-100 shadow-md hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-300 to-primary-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-neutral-900 mb-2">Рейтинг {stats.avgRating}/5</h4>
            <p className="text-sm text-neutral-600">Средняя оценка от наших учеников</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-secondary-100 shadow-md hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary-300 to-accent-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-neutral-900 mb-2">{stats.subjectCount} предметов</h4>
            <p className="text-sm text-neutral-600">От математики до языков</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-primary-100 shadow-md hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-neutral-900 mb-2">Прогресс {stats.progressRate}%</h4>
            <p className="text-sm text-neutral-600">Учеников улучшили свои результаты</p>
          </div>
        </div>
      </section>

      {/* Featured Tutors */}
      <section className="max-w-6xl mx-auto px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-neutral-900">Популярные репетиторы</h2>
          <Button
            onClick={() => onNavigate('catalog')}
            variant="outline"
            className="border-primary-300 text-primary-600 hover:bg-primary-50"
          >
            Смотреть всех <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Загружаем репетиторов...</p>
          </div>
        ) : featuredTutors.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredTutors.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onViewDetails={onViewTutorDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/80 rounded-2xl border border-primary-100">
            <p className="text-neutral-600">Репетиторы не найдены</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto mt-20 px-8">
        <div className="bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="mb-4">Начни учиться уже сегодня!</h2>
          <p className="text-lg mb-8 opacity-90">
            Зарегистрируйся и найди репетитора, который поможет тебе достичь твоих целей
          </p>
          <Button
            onClick={() => onNavigate('login')}
            className="bg-white text-primary-600 hover:bg-neutral-100 px-8"
          >
            Зарегистрироваться
          </Button>
        </div>
      </section>
    </div>
  );
}
