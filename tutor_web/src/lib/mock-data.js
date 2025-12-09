// Mock данные для демонстрации приложения

export const UserRole = {
    ADMIN: 'admin',
    TUTOR: 'tutor',
    STUDENT: 'student'
};

// Предметы
export const subjects = [
  { id: '1', name: 'Математика', icon: '📐' },
  { id: '2', name: 'Русский язык', icon: '📝' },
  { id: '3', name: 'Английский язык', icon: '🇬🇧' },
  { id: '4', name: 'Физика', icon: '⚛️' },
  { id: '5', name: 'Химия', icon: '🧪' },
  { id: '6', name: 'Информатика', icon: '💻' },
  { id: '7', name: 'История', icon: '📚' },
  { id: '8', name: 'Биология', icon: '🌿' },
];

// Репетиторы
export const tutors = [
  {
    id: '1',
    name: 'Анна Смирнова',
    avatar: 'https://images.unsplash.com/photo-1643899348858-43ac198cdf18?w=200',
    subjects: ['Математика', 'Физика'],
    experience: 5,
    pricePerHour: 1500,
    ratingAvg: 4.9,
    reviewCount: 28,
    bio: 'Кандидат физико-математических наук, более 5 лет опыта преподавания. Индивидуальный подход к каждому ученику.',
  },
  {
    id: '2',
    name: 'Дмитрий Петров',
    avatar: 'https://images.unsplash.com/photo-1613206468203-fa00870edf79?w=200',
    subjects: ['Английский язык'],
    experience: 8,
    pricePerHour: 2000,
    ratingAvg: 4.8,
    reviewCount: 45,
    bio: 'Сертифицированный преподаватель английского языка с международным опытом. IELTS, TOEFL подготовка.',
  },
  {
    id: '3',
    name: 'Мария Иванова',
    avatar: 'https://images.unsplash.com/photo-1683418925797-4c489d50baf2?w=200',
    subjects: ['Русский язык', 'История'],
    experience: 3,
    pricePerHour: 1200,
    ratingAvg: 4.7,
    reviewCount: 19,
    bio: 'Увлеченный педагог с творческим подходом. Помогу полюбить русский язык и историю!',
  },
  {
    id: '4',
    name: 'Александр Козлов',
    avatar: 'https://images.unsplash.com/photo-1599951420058-5ec049a03e20?w=200',
    subjects: ['Информатика'],
    experience: 6,
    pricePerHour: 1800,
    ratingAvg: 5.0,
    reviewCount: 32,
    bio: 'Senior разработчик с опытом преподавания. Python, JavaScript, алгоритмы и структуры данных.',
  },
  {
    id: '5',
    name: 'Елена Волкова',
    avatar: 'https://images.unsplash.com/photo-1643899348858-43ac198cdf18?w=200',
    subjects: ['Химия', 'Биология'],
    experience: 4,
    pricePerHour: 1400,
    ratingAvg: 4.6,
    reviewCount: 22,
    bio: 'Биохимик по образованию. Готовлю к ЕГЭ по химии и биологии с высокими результатами.',
  },
  {
    id: '6',
    name: 'Сергей Новиков',
    avatar: 'https://images.unsplash.com/photo-1613206468203-fa00870edf79?w=200',
    subjects: ['Математика'],
    experience: 10,
    pricePerHour: 2500,
    ratingAvg: 4.9,
    reviewCount: 67,
    bio: 'Заслуженный преподаватель математики. Работаю со школьниками и абитуриентами более 10 лет.',
  },
];

// Отзывы
export const reviews = [
  {
    id: '1',
    tutorId: '1',
    studentId: 's1',
    studentName: 'Иван Соколов',
    studentAvatar: 'https://images.unsplash.com/photo-1643899348858-43ac198cdf18?w=100',
    rating: 5,
    comment: 'Отличный репетитор! Анна очень доступно объясняет сложные темы. За месяц занятий мои оценки по математике значительно улучшились.',
    datePosted: '2025-11-10',
  },
  {
    id: '2',
    tutorId: '1',
    studentId: 's2',
    studentName: 'Мария Кузнецова',
    studentAvatar: 'https://images.unsplash.com/photo-1683418925797-4c489d50baf2?w=100',
    rating: 5,
    comment: 'Очень довольна занятиями! Индивидуальный подход, терпеливость и профессионализм.',
    datePosted: '2025-11-08',
  },
  {
    id: '3',
    tutorId: '2',
    studentId: 's3',
    studentName: 'Алексей Морозов',
    studentAvatar: 'https://images.unsplash.com/photo-1599951420058-5ec049a03e20?w=100',
    rating: 5,
    comment: 'Дмитрий помог мне подготовиться к IELTS. Набрал 7.5 баллов! Рекомендую всем.',
    datePosted: '2025-11-05',
  },
  {
    id: '4',
    tutorId: '4',
    studentId: 's1',
    studentName: 'Иван Соколов',
    studentAvatar: 'https://images.unsplash.com/photo-1643899348858-43ac198cdf18?w=100',
    rating: 5,
    comment: 'Александр - профессионал своего дела. Объясняет программирование понятно и с примерами из реальной практики.',
    datePosted: '2025-11-12',
  },
];

// Уроки
export const lessons = [
  {
    id: '1',
    tutorId: '1',
    tutorName: 'Анна Смирнова',
    studentId: 's1',
    studentName: 'Иван Соколов',
    subject: 'Математика',
    date: '2025-11-16',
    time: '15:00',
    status: 'scheduled',
    duration: 60,
  },
  {
    id: '2',
    tutorId: '2',
    tutorName: 'Дмитрий Петров',
    studentId: 's1',
    studentName: 'Иван Соколов',
    subject: 'Английский язык',
    date: '2025-11-17',
    time: '16:30',
    status: 'scheduled',
    duration: 60,
  },
  {
    id: '3',
    tutorId: '1',
    tutorName: 'Анна Смирнова',
    studentId: 's1',
    studentName: 'Иван Соколов',
    subject: 'Математика',
    date: '2025-11-10',
    time: '15:00',
    status: 'completed',
    duration: 60,
  },
  {
    id: '4',
    tutorId: '4',
    tutorName: 'Александр Козлов',
    studentId: 's2',
    studentName: 'Мария Кузнецова',
    subject: 'Информатика',
    date: '2025-11-18',
    time: '14:00',
    status: 'pending',
    duration: 90,
  },
];

// Опросы удовлетворенности
export const surveys = [
  {
    id: '1',
    studentId: 's1',
    tutorId: '1',
    lessonId: '3',
    satisfactionLevel: 5,
    knowledgeGrowth: 4,
    comments: 'Очень полезный урок, все понял!',
    submittedAt: '2025-11-10',
  },
  {
    id: '2',
    studentId: 's3',
    tutorId: '2',
    lessonId: 'l5',
    satisfactionLevel: 5,
    knowledgeGrowth: 5,
    comments: 'Отличная подача материала',
    submittedAt: '2025-11-09',
  },
];

// Отчеты аналитики
export const analyticsReports = [
  {
    id: 'r1',
    generatedAt: '2025-11-15 10:00',
    avgSatisfaction: 4.8,
    avgKnowledgeGrowth: 4.5,
    totalLessons: 156,
    activeStudents: 45,
    activeTutors: 12,
    logIndexId: 98,
  },
  {
    id: 'r2',
    generatedAt: '2025-11-14 10:00',
    avgSatisfaction: 4.7,
    avgKnowledgeGrowth: 4.4,
    totalLessons: 142,
    activeStudents: 43,
    activeTutors: 12,
    logIndexId: 96,
  },
  {
    id: 'r3',
    generatedAt: '2025-11-13 10:00',
    avgSatisfaction: 4.9,
    avgKnowledgeGrowth: 4.6,
    totalLessons: 138,
    activeStudents: 41,
    activeTutors: 11,
    logIndexId: 97,
  },
];

// Текущий пользователь (для демо можно переключать роль)
export const currentUser = {
  id: 's1',
  name: 'Иван Соколов',
  email: 'ivan@example.com',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1643899348858-43ac198cdf18?w=200',
  registeredAt: '2025-10-01',
};

// Данные для статистики по популярности предметов
export const subjectPopularity = [
  { subject: 'Математика', count: 45 },
  { subject: 'Английский язык', count: 38 },
  { subject: 'Русский язык', count: 32 },
  { subject: 'Информатика', count: 28 },
  { subject: 'Физика', count: 25 },
  { subject: 'Химия', count: 20 },
  { subject: 'История', count: 18 },
  { subject: 'Биология', count: 15 },
];

// Данные для графиков аналитики
export const satisfactionData = [
  { date: '10.11', value: 4.6 },
  { date: '11.11', value: 4.7 },
  { date: '12.11', value: 4.8 },
  { date: '13.11', value: 4.9 },
  { date: '14.11', value: 4.7 },
  { date: '15.11', value: 4.8 },
];

export const knowledgeGrowthData = [
  { date: '10.11', value: 4.2 },
  { date: '11.11', value: 4.3 },
  { date: '12.11', value: 4.5 },
  { date: '13.11', value: 4.6 },
  { date: '14.11', value: 4.4 },
  { date: '15.11', value: 4.5 },
];