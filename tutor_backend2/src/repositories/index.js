const userRepository = require('./user.repository');
const roleRepository = require('./role.repository');
const subjectRepository = require('./subject.repository');
const tutorRepository = require('./tutor.repository');
const lessonRequestRepository = require('./lessonRequest.repository');
const lessonRepository = require('./lesson.repository');
const lessonChangeRequestRepository = require('./lessonChangeRequest.repository');
const reviewRepository = require('./review.repository');
const surveyRepository = require('./survey.repository');
const analyticsRepository = require('./analytics.repository');
const notificationRepository = require('./notification.repository');
const tutorScheduleRepository = require('./tutorSchedule.repository');

module.exports = {
    userRepository,
    roleRepository,
    subjectRepository,
    tutorRepository,
    lessonRequestRepository,
    lessonRepository,
    lessonChangeRequestRepository,
    reviewRepository,
    surveyRepository,
    analyticsRepository,
    notificationRepository,
    tutorScheduleRepository
};