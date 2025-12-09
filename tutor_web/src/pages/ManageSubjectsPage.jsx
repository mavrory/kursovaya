import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';

export function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env?.VITE_API_URL ||
      import.meta.env?.REACT_APP_API_URL ||
      'http://localhost:5000/api';

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const data = await response.json();
      const subjectsData = data.data || data;

      // Форматируем предметы
      const formattedSubjects = Array.isArray(subjectsData) ? subjectsData.map(subject => {
        const subjectData = subject.toJSON ? subject.toJSON() : subject;
        return {
          id: subjectData.subject_id || subjectData.id,
          name: subjectData.name || 'Без названия',
          description: subjectData.description || '',
          icon: getSubjectIcon(subjectData.name)
        };
      }) : [];

      setSubjects(formattedSubjects);

    } catch (err) {
      console.error('Ошибка загрузки предметов:', err);
      setError(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

    if (!subjectName) return '📚';
    const foundKey = Object.keys(iconMap).find(key =>
      subjectName.toLowerCase().includes(key.toLowerCase())
    );
    return foundKey ? iconMap[foundKey] : '📚';
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('Введите название предмета');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/subjects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSubject.name,
          description: newSubject.description || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при добавлении предмета' }));
        throw new Error(errorData.error || 'Ошибка при добавлении предмета');
      }

      toast.success('Предмет добавлен');
      setNewSubject({ name: '', description: '' });
      setIsAdding(false);
      await loadSubjects();
    } catch (err) {
      console.error('Ошибка добавления предмета:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот предмет?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при удалении предмета' }));
        throw new Error(errorData.error || 'Ошибка при удалении предмета');
      }

      toast.success('Предмет удален');
      await loadSubjects();
    } catch (err) {
      console.error('Ошибка удаления предмета:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  const handleUpdateSubject = async (id, name, description) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/subjects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: description || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при обновлении предмета' }));
        throw new Error(errorData.error || 'Ошибка при обновлении предмета');
      }

      toast.success('Предмет обновлен');
      setEditingId(null);
      await loadSubjects();
    } catch (err) {
      console.error('Ошибка обновления предмета:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Загружаем предметы...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-neutral-900 mb-2">Управление предметами</h1>
          <p className="text-neutral-600">Добавляй, редактируй или удаляй предметы</p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить предмет
        </Button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Subject Form */}
      {isAdding && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-primary-100">
          <h3 className="text-neutral-900 mb-4">Новый предмет</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="subject-name">Название предмета</Label>
              <Input
                id="subject-name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Например: География"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject-description">Описание (опционально)</Label>
              <Input
                id="subject-description"
                value={newSubject.description}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                placeholder="Краткое описание"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddSubject} className="bg-green-500 hover:bg-green-600 text-white">
              Сохранить
            </Button>
            <Button onClick={() => setIsAdding(false)} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md border border-primary-100 hover:shadow-lg transition-all"
            >
              {editingId === subject.id ? (
                <div className="space-y-3">
                  <Input
                    value={subject.name}
                    onChange={(e) => setSubjects(subjects.map(s => 
                      s.id === subject.id ? { ...s, name: e.target.value } : s
                    ))}
                    className="mb-2"
                  />
                  <Input
                    value={subject.description || ''}
                    onChange={(e) => setSubjects(subjects.map(s => 
                      s.id === subject.id ? { ...s, description: e.target.value } : s
                    ))}
                    placeholder="Описание"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateSubject(subject.id, subject.name, subject.description)}
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      Сохранить
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-full flex items-center justify-center text-2xl">
                      {subject.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-neutral-900">{subject.name}</h4>
                      {subject.description && (
                        <p className="text-xs text-neutral-600 mt-1">{subject.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingId(subject.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-primary-300 text-primary-600 hover:bg-primary-50"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Изменить
                    </Button>
                    <Button
                      onClick={() => handleDeleteSubject(subject.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary-100">
          <p className="text-neutral-600">Предметы не найдены. Добавьте первый предмет!</p>
        </div>
      )}
    </div>
  );
}
