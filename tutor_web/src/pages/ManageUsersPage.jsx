import { Search, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { toast } from 'react-hot-toast';

export function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env?.VITE_API_URL ||
      import.meta.env?.REACT_APP_API_URL ||
      'http://localhost:5000/api';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const data = await response.json();
      const usersData = data.data || data;

      // Форматируем пользователей
      const formattedUsers = Array.isArray(usersData) ? usersData.map(user => {
        const userData = user.toJSON ? user.toJSON() : user;
        return {
          id: userData.user_id || userData.id,
          name: userData.name || 'Без имени',
          email: userData.email || '',
          role: userData.role_name || userData.role || 'student',
          status: userData.is_blocked ? 'blocked' : 'active',
          registeredAt: userData.date_registered || new Date().toISOString()
        };
      }) : [];

      setUsers(formattedUsers);

    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const user = users.find(u => u.id === userId);
      const newStatus = user.status === 'active' ? true : false; // true = blocked

      const response = await fetch(`${API_URL}/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_blocked: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при изменении статуса');
      }

      toast.success(newStatus ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      
      // Обновляем статус пользователя в локальном состоянии сразу
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: newStatus ? 'blocked' : 'active' } : u
      ));
      
      // Затем перезагружаем данные с сервера
      await loadUsers();
    } catch (err) {
      console.error('Ошибка изменения статуса:', err);
      toast.error(`Ошибка: ${err.message}`);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'student': return 'Ученик';
      case 'tutor': return 'Репетитор';
      case 'admin': return 'Администратор';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'student': return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'tutor': return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'admin': return 'bg-secondary-100 text-secondary-700 border-secondary-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Загружаем пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-neutral-900 mb-2">Управление пользователями</h1>
        <p className="text-neutral-600">Управляй аккаунтами и ролями пользователей</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-primary-100">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-700 mb-2">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Имя или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-700 mb-2">Роль</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все роли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="student">Ученики</SelectItem>
                <SelectItem value="tutor">Репетиторы</SelectItem>
                <SelectItem value="admin">Администраторы</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Найдено: <span className="text-neutral-900">{filteredUsers.length}</span> пользователей
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-primary-200">
                <th className="text-left py-4 px-6 text-sm text-neutral-700">Пользователь</th>
                <th className="text-left py-4 px-6 text-sm text-neutral-700">Email</th>
                <th className="text-left py-4 px-6 text-sm text-neutral-700">Роль</th>
                <th className="text-left py-4 px-6 text-sm text-neutral-700">Статус</th>
                <th className="text-left py-4 px-6 text-sm text-neutral-700">Дата регистрации</th>
                <th className="text-left py-4 px-6 text-sm text-neutral-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 hover:bg-primary-50/30">
                    <td className="py-4 px-6">
                      <p className="text-sm text-neutral-900">{user.name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-neutral-600">{user.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={getRoleBadgeClass(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={user.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-100 text-red-700 border-red-200'
                      }>
                        {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-neutral-600">
                        {new Date(user.registeredAt).toLocaleDateString('ru-RU')}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(user.id)}
                        className={user.status === 'active'
                          ? 'border-red-300 text-red-600 hover:bg-red-50'
                          : 'border-green-300 text-green-600 hover:bg-green-50'
                        }
                      >
                        {user.status === 'active' ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" /> Заблокировать
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" /> Разблокировать
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-neutral-600">Пользователи не найдены</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
