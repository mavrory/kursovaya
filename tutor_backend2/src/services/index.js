// Основные сервисы для таблиц БД
const roleService = require('./role.service');
const userService = require('./user.service');
const subjectService = require('./subject.service');
const tutorService = require('./tutor.service');
const lessonRequestService = require('./lessonRequest.service');
const lessonService = require('./lesson.service');
const lessonChangeRequestService = require('./lessonChangeRequest.service');
const reviewService = require('./review.service');
const surveyService = require('./survey.service');
const analyticsService = require('./analytics.service');

// Специальные сервисы (не привязаны к конкретной таблице)
const authService = require('./auth.service');
const dashboardService = require('./dashboard.service');
const notificationService = require('./notification.service');

module.exports = {
    roleService,
    userService,
    subjectService,
    tutorService,
    lessonRequestService,
    lessonService,
    lessonChangeRequestService,
    reviewService,
    surveyService,
    analyticsService,

    authService,
    dashboardService,
    notificationService
};