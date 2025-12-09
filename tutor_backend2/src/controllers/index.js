const authController = require('./auth.controller');
const userController = require('./user.controller');
const tutorController = require('./tutor.controller');
const lessonController = require('./lesson.controller');
const lessonRequestController = require('./lessonRequest.controller');
const reviewController = require('./review.controller');
const subjectController = require('./subject.controller');
const surveyController = require('./survey.controller');
const analyticsController = require('./analytics.controller');
const lessonChangeRequestController = require('./lessonChangeRequest.controller');
const roleController = require('./role.controller');
const dashboardController = require('./dashboard.controller');
const notificationController = require('./notification.controller');

module.exports = {
    authController,
    userController,
    tutorController,
    lessonController,
    lessonRequestController,
    reviewController,
    subjectController,
    surveyController,
    analyticsController,
    lessonChangeRequestController,
    roleController,
    dashboardController,
    notificationController
};