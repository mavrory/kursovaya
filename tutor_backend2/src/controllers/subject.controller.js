const { subjectService } = require('../services');

class SubjectController {
    async getAllSubjects(req, res) {
        try {
            const subjects = await subjectService.getAllSubjects();
            // Для каталога возвращаем чистый массив без обертки
            res.json(subjects);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getSubjectById(req, res) {
        try {
            const subject = await subjectService.getSubjectById(req.params.id);

            res.json({
                success: true,
                data: subject
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async createSubject(req, res) {
        try {
            // Только админ может создавать предметы
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can create subjects'
                });
            }

            const subject = await subjectService.createSubject(req.body);

            res.status(201).json({
                success: true,
                message: 'Subject created successfully',
                data: subject
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getSubjectWithTutors(req, res) {
        try {
            const subjectWithTutors = await subjectService.getSubjectWithTutors(req.params.id);

            res.json({
                success: true,
                data: subjectWithTutors
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPopularSubjects(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            const popularSubjects = await subjectService.getPopularSubjects(limit);

            res.json({
                success: true,
                data: popularSubjects
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }


    async updateSubject(req, res) {
        try {
            // Только админ может обновлять предметы
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can update subjects'
                });
            }

            const updatedSubject = await subjectService.updateSubject(req.params.id, req.body);

            res.json({
                success: true,
                message: 'Subject updated successfully',
                data: updatedSubject
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async deleteSubject(req, res) {
        try {
            // Только админ может удалять предметы
            if (req.user.role_name !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can delete subjects'
                });
            }

            const deletedSubject = await subjectService.deleteSubject(req.params.id);

            res.json({
                success: true,
                message: 'Subject deleted successfully',
                data: deletedSubject
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new SubjectController();