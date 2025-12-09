const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Импорт всех роутов
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const tutorRoutes = require('./routes/tutor.routes');
const lessonRoutes = require('./routes/lesson.routes');
const lessonRequestRoutes = require('./routes/lessonRequest.routes');
const reviewRoutes = require('./routes/review.routes');
const subjectRoutes = require('./routes/subject.routes');
const surveyRoutes = require('./routes/survey.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const lessonChangeRequestRoutes = require('./routes/lessonChangeRequest.routes');
const roleRoutes = require('./routes/role.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');

// Импорт middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/tutor', tutorRoutes); // Дополнительный маршрут для совместимости с клиентом
app.use('/api/lessons', lessonRoutes);
app.use('/api/lesson-requests', lessonRequestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/change-requests', lessonChangeRequestRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Tutor Platform API'
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'Tutor Platform API',
        version: '1.0.0',
        endpoints: [
            '/api/auth - Authentication',
            '/api/users - User management',
            '/api/tutors - Tutor management',
            '/api/lessons - Lesson management',
            '/api/lesson-requests - Lesson requests',
            '/api/reviews - Reviews system',
            '/api/subjects - Subjects management',
            '/api/surveys - Satisfaction surveys',
            '/api/analytics - Analytics and reports',
            '/api/lesson-changes - Lesson change requests',
            '/api/roles - Role management'
        ]
    });
});

// 404 обработка
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.url
    });
});

// Глобальная обработка ошибок
app.use(errorHandler);

module.exports = app;