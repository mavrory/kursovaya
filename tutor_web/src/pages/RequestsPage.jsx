import { Check, X, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'react-hot-toast';

export function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env?.VITE_API_URL ||
      import.meta.env?.REACT_APP_API_URL ||
      'http://localhost:5000/api';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/lesson-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const data = await response.json();
      const requestsData = data.data || data;

      // Форматируем запросы
      const formattedRequests = Array.isArray(requestsData) ? requestsData.map(req => {
        const requestData = req.toJSON ? req.toJSON() : req;
        const scheduledTime = requestData.scheduled_time ? new Date(requestData.scheduled_time) : new Date();
        
        return {
          id: requestData.request_id || requestData.id,
          studentId: requestData.student_id,
          studentName: requestData.student_name || 'Неизвестный студент',
          studentAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(requestData.student_name || 'Студент')}&background=random`,
          subject: requestData.subject_name || 'Не указан',
          preferredDate: scheduledTime.toISOString().split('T')[0],
          preferredTime: scheduledTime.toTimeString().split(' ')[0].substring(0, 5),
          duration: 60,
          message: requestData.message || 'Запрос на урок',
          requestedAt: requestData.date_created || new Date().toISOString(),
          status: requestData.status || 'pending'
        };
      }) : [];

      setRequests(formattedRequests);

    } catch (err) {
      console.error('Ошибка загрузки запросов:', err);
      setError(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/lesson-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'accepted'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при принятии запроса' }));
        throw new Error(errorData.error || 'Ошибка при принятии запроса');
      }

      toast.success('Запрос принят');
      await loadRequests();
    } catch (err) {
      console.error('Ошибка принятия запроса:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/lesson-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при отклонении запроса' }));
        throw new Error(errorData.error || 'Ошибка при отклонении запроса');
      }

      toast.success('Запрос отклонен');
      await loadRequests();
    } catch (err) {
      console.error('Ошибка отклонения запроса:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Загружаем запросы...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-neutral-900 mb-2">Запросы от учеников</h1>
        <p className="text-neutral-600">Управляй входящими запросами на уроки</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Requests */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-neutral-900">
            Новые запросы ({pendingRequests.length})
          </h3>
          {pendingRequests.length > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              Требуют ответа
            </Badge>
          )}
        </div>

        {pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div
                key={request.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={request.studentAvatar}
                    alt={request.studentName}
                    className="w-16 h-16 rounded-full object-cover border-4 border-primary-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-neutral-900 mb-1">{request.studentName}</h4>
                        <Badge className="bg-secondary-100 text-secondary-700 border-secondary-200">
                          {request.subject}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {new Date(request.requestedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        <span>
                          {new Date(request.preferredDate).toLocaleDateString('ru-RU', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Clock className="w-4 h-4 text-accent-500" />
                        <span>{request.preferredTime} ({request.duration} мин)</span>
                      </div>
                    </div>

                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-neutral-700">{request.message}</p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Принять запрос
                      </Button>
                      <Button
                        onClick={() => handleDeclineRequest(request.id)}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Нет новых запросов"
            description="Когда ученики захотят записаться к тебе на урок, их запросы появятся здесь"
            animalType="fox"
          />
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-neutral-900 mb-4">
            Обработанные запросы ({processedRequests.length})
          </h3>
          <div className="space-y-3">
            {processedRequests.map(request => (
              <div
                key={request.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-neutral-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={request.studentAvatar}
                      alt={request.studentName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
                    />
                    <div>
                      <p className="text-sm text-neutral-900">{request.studentName}</p>
                      <p className="text-xs text-neutral-600">{request.subject}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      request.status === 'accepted'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }
                  >
                    {request.status === 'accepted' ? 'Принято' : 'Отклонено'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
