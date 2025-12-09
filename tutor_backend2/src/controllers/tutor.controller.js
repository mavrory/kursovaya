const { tutorService } = require('../services');

class TutorController {
    async registerAsTutor(req, res) {
        try {
            const tutorData = {
                user_id: req.user.user_id,
                ...req.body
            };

            const tutorProfile = await tutorService.registerAsTutor(tutorData);

            res.status(201).json({
                success: true,
                message: 'Registered as tutor successfully',
                data: tutorProfile
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTutorProfile(req, res) {
        try {
            const tutor_id = req.params.id ? parseInt(req.params.id) : req.user.user_id;
            
            if (!tutor_id || isNaN(tutor_id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid tutor ID'
                });
            }
            
            const profile = await tutorService.getTutorProfile(tutor_id);

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Error getting tutor profile:', error);
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async getAllTutors(req, res) {
        try {
            // Каталогу нужен плоский список без обертки
            const tutors = await tutorService.getCatalogTutors();
            res.json(tutors);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateTutorProfile(req, res) {
        try {
            const updatedProfile = await tutorService.updateTutorProfile(req.user.user_id, req.body);

            res.json({
                success: true,
                message: 'Tutor profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateTutorRating(req, res) {
        try {
            const tutor_id = req.params.id || req.user.user_id;
            const ratingStats = await tutorService.updateTutorRating(tutor_id);

            res.json({
                success: true,
                message: 'Tutor rating updated',
                data: ratingStats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRecommendedTutors(req, res) {
        try {
            const user_id = req.user?.user_id;
            const recommendedTutors = await tutorService.getRecommendedTutors(user_id);

            res.json(recommendedTutors);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getSchedule(req, res) {
        try {
            const tutor_id = req.user.user_id;
            const schedule = await tutorService.getTutorSchedule(tutor_id);

            res.json(schedule);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPublicTutorSchedule(req, res) {
        try {
            const tutor_id = parseInt(req.params.id);
            
            if (!tutor_id || isNaN(tutor_id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid tutor ID'
                });
            }
            
            const schedule = await tutorService.getTutorSchedule(tutor_id);

            res.json(schedule);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async blockTime(req, res) {
        try {
            const tutor_id = req.user.user_id;
            const { date, time_slots } = req.body;

            if (!date || !Array.isArray(time_slots) || time_slots.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Date and time_slots array are required'
                });
            }

            // Формируем массив слотов для блокировки
            const scheduleItems = time_slots.map(time => {
                // Предполагаем, что time в формате "HH:MM"
                const [hours, minutes] = time.split(':').map(Number);
                const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                
                // По умолчанию длительность 1 час
                const endHours = (hours + 1) % 24;
                const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

                return {
                    tutor_id,
                    schedule_date: date,
                    start_time: startTime,
                    end_time: endTime,
                    status: 'blocked',
                    reason: 'Manually blocked by tutor'
                };
            });

            // Сохраняем заблокированные слоты в БД
            const blockedSlots = await tutorService.blockTimeSlots(scheduleItems);

            res.json({
                success: true,
                message: 'Time slots blocked successfully',
                data: blockedSlots
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getStudents(req, res) {
        try {
            const tutor_id = req.user.user_id;
            const students = await tutorService.getTutorStudents(tutor_id);

            res.json(students);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new TutorController();