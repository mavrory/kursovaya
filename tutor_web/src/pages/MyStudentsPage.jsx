import { useState, useEffect } from 'react';
import { Star, TrendingUp, Calendar, Search, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ReviewCard } from '../components/ReviewCard';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-hot-toast';

export function MyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentReviews, setStudentReviews] = useState([]);

  const API_URL = import.meta.env?.VITE_API_URL ||
      import.meta.env?.REACT_APP_API_URL ||
      'http://localhost:5000/api';

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentReviews(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/tutors/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const studentsData = await response.json();
      setStudents(Array.isArray(studentsData) ? studentsData : []);

    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
      setError(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentReviews = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reviews/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const reviewsData = await response.json();
        // Фильтруем отзывы для выбранного студента
        const filtered = Array.isArray(reviewsData) 
          ? reviewsData.filter(r => r.tutor_id === studentId)
          : [];
        setStudentReviews(filtered);
      }
    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Загружаем список учеников...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-2 font-medium">Ошибка загрузки</p>
        <p className="text-sm text-neutral-600 mb-4">{error}</p>
        <button
          onClick={loadStudents}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-neutral-900 mb-2">Мои ученики</h1>
        <p className="text-neutral-600">Отслеживай прогресс своих учеников</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-primary-100 shadow-md">
          <p className="text-sm text-neutral-600 mb-1">Всего учеников</p>
          <p className="text-3xl text-primary-600">{students.length}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-accent-100 shadow-md">
          <p className="text-sm text-neutral-600 mb-1">Активных учеников</p>
          <p className="text-3xl text-accent-600">
            {students.filter(s => s.nextLesson).length}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-secondary-100 shadow-md">
          <p className="text-sm text-neutral-600 mb-1">Всего уроков</p>
          <p className="text-3xl text-secondary-600">
            {students.reduce((sum, s) => sum + s.completedLessons, 0)}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-primary-100 shadow-md">
          <p className="text-sm text-neutral-600 mb-1">Средний прогресс</p>
          <p className="text-3xl text-green-600">
            {students.length > 0
              ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
              : 0}%
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Поиск учеников..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="space-y-4">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md border transition-all cursor-pointer ${
                    selectedStudent?.id === student.id
                      ? 'border-primary-400 shadow-lg'
                      : 'border-primary-100 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-primary-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-neutral-900 mb-1">{student.name}</h4>
                          <Badge className="bg-secondary-100 text-secondary-700 border-secondary-200">
                            {student.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < student.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Calendar className="w-4 h-4 text-primary-500" />
                          <span>
                            {student.completedLessons}/{student.totalLessons} уроков
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>Прогресс: {student.progress}%</span>
                        </div>
                      </div>

                      {student.nextLesson && (
                        <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
                          <p className="text-xs text-accent-700 mb-1">Следующий урок:</p>
                          <p className="text-sm text-accent-900">
                            {new Date(student.nextLesson.date).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                            })}{' '}
                            в {student.nextLesson.time}
                          </p>
                        </div>
                      )}

                      {!student.nextLesson && (
                        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                          <p className="text-xs text-neutral-600">Нет запланированных уроков</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет учеников"
              description="У вас пока нет учеников"
              animalType="panda"
            />
          )}
        </div>

        {/* Student Details Sidebar */}
        <div>
          {selectedStudent ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 sticky top-6">
              <div className="text-center mb-6">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-200 mx-auto mb-4"
                />
                <h3 className="text-neutral-900 mb-2">{selectedStudent.name}</h3>
                <Badge className="bg-secondary-100 text-secondary-700 border-secondary-200">
                  {selectedStudent.subject}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-xs text-primary-700 mb-1">Занимается с</p>
                  <p className="text-sm text-primary-900">
                    {new Date(selectedStudent.joinedDate).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                  <p className="text-xs text-accent-700 mb-2">Прогресс</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-400 to-primary-400 transition-all"
                        style={{ width: `${selectedStudent.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-accent-900">{selectedStudent.progress}%</span>
                  </div>
                </div>

                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                  <p className="text-xs text-secondary-700 mb-1">Завершено уроков</p>
                  <p className="text-2xl text-secondary-900">
                    {selectedStudent.completedLessons}
                  </p>
                </div>
              </div>

              {studentReviews.length > 0 && (
                <div className="mt-6 pt-6 border-t border-primary-200">
                  <h5 className="text-neutral-900 mb-3">Отзывы ученика</h5>
                  <div className="space-y-3">
                    {studentReviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary-100">
              <p className="text-neutral-600">Выбери ученика, чтобы увидеть детали</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
