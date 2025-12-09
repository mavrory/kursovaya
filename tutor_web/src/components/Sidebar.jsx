import { Home, Search, Calendar, MessageSquare, Star, BarChart3, Users, BookOpen, LogOut, PawPrint } from 'lucide-react';
import { UserRole } from '../lib/mock-data';

export function Sidebar({ userRole, currentPage, onNavigate, onLogout }) {
  const guestLinks = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'catalog', label: 'Каталог репетиторов', icon: Search },
    { id: 'login', label: 'Войти', icon: LogOut },
  ];

  const studentLinks = [
    { id: 'dashboard', label: 'Мой кабинет', icon: Home },
    { id: 'catalog', label: 'Каталог репетиторов', icon: Search },
    { id: 'my-lessons', label: 'Мои уроки', icon: Calendar },
    { id: 'my-reviews', label: 'Мои отзывы', icon: Star },
    { id: 'surveys', label: 'Опросы', icon: MessageSquare },
  ];

  const tutorLinks = [
    { id: 'tutor-dashboard', label: 'Мой кабинет', icon: Home },
    { id: 'schedule', label: 'Расписание', icon: Calendar },
    { id: 'requests', label: 'Запросы от учеников', icon: MessageSquare },
    { id: 'my-students', label: 'Мои ученики', icon: Users },
  ];

  const adminLinks = [
    { id: 'admin-dashboard', label: 'Аналитика', icon: BarChart3 },
    { id: 'manage-users', label: 'Пользователи', icon: Users },
    { id: 'manage-subjects', label: 'Предметы', icon: BookOpen },
  ];

  const links = 
    userRole === 'student' ? studentLinks :
    userRole === 'tutor' ? tutorLinks :
    userRole === 'admin' ? adminLinks :
    guestLinks;

  const getRoleLabel = () => {
    switch (userRole) {
      case 'student':
        return 'Ученик';
      case 'tutor':
        return 'Репетитор';
      case 'admin':
        return 'Администратор';
      default:
        return 'Гость';
    }
  };

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-primary-200 p-6 min-h-screen flex flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-secondary-300 rounded-xl flex items-center justify-center">
          <PawPrint className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-primary-600">TutorPaw</h2>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentPage === link.id
                ? 'bg-gradient-to-r from-primary-400 to-secondary-400 text-white shadow-lg'
                : 'text-neutral-700 hover:bg-primary-100'
            }`}
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-primary-200 space-y-3">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-300 to-primary-300"></div>
          <div className="flex-1">
            <p className="text-sm text-neutral-800">Профиль</p>
            <p className="text-xs text-neutral-500">{getRoleLabel()}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-red-600 hover:bg-red-50 border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}