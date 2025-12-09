const { subjectRepository, tutorRepository, lessonRequestRepository } = require('../repositories');

class SubjectService {
    async getAllSubjects() {
        try {
            return await subjectRepository.findAll();
        } catch (error) {
            throw new Error(`Failed to get subjects: ${error.message}`);
        }
    }

    async getSubjectById(subject_id) {
        try {
            const subject = await subjectRepository.findById(subject_id);
            if (!subject) {
                throw new Error('Subject not found');
            }
            return subject;
        } catch (error) {
            throw new Error(`Failed to get subject: ${error.message}`);
        }
    }

    async createSubject(subjectData) {
        try {
            const { name, description } = subjectData;

            // Проверяем, существует ли уже предмет с таким названием
            const existingSubjects = await subjectRepository.findAll();
            const existing = existingSubjects.find(subject =>
                subject.name.toLowerCase() === name.toLowerCase()
            );

            if (existing) {
                throw new Error('Subject with this name already exists');
            }

            return await subjectRepository.create({ name, description });
        } catch (error) {
            throw new Error(`Failed to create subject: ${error.message}`);
        }
    }

    async updateSubject(subject_id, updateData) {
        try {
            const subject = await subjectRepository.findById(subject_id);
            if (!subject) {
                throw new Error('Subject not found');
            }

            // Проверяем уникальность названия
            if (updateData.name && updateData.name !== subject.name) {
                const existingSubjects = await subjectRepository.findAll();
                const existing = existingSubjects.find(s =>
                    s.name.toLowerCase() === updateData.name.toLowerCase() &&
                    s.subject_id !== subject_id
                );

                if (existing) {
                    throw new Error('Subject with this name already exists');
                }
            }

            // Используем метод update репозитория
            return await subjectRepository.update(subject_id, updateData);
        } catch (error) {
            throw new Error(`Failed to update subject: ${error.message}`);
        }
    }

    async deleteSubject(subject_id) {
        try {
            const subject = await subjectRepository.findById(subject_id);
            if (!subject) {
                throw new Error('Subject not found');
            }

            // Проверяем использование
            const tutors = await tutorRepository.findAll();
            const tutorsUsingSubject = tutors.filter(tutor => tutor.subject_id === subject_id);

            if (tutorsUsingSubject.length > 0) {
                throw new Error(`Cannot delete subject that is used by ${tutorsUsingSubject.length} tutors`);
            }

            // Используем метод delete репозитория
            return await subjectRepository.delete(subject_id);
        } catch (error) {
            throw new Error(`Failed to delete subject: ${error.message}`);
        }
    }

    async getSubjectWithTutors(subject_id) {
        try {
            const subject = await subjectRepository.findById(subject_id);
            if (!subject) {
                throw new Error('Subject not found');
            }

            // Получаем всех репетиторов по этому предмету
            const allTutors = await tutorRepository.findAll();
            const subjectTutors = allTutors.filter(tutor => tutor.subject_id === subject_id);

            // Получаем статистику по запросам на уроки
            // (нужно добавить метод в lessonRequestRepository)

            return {
                subject: subject.toJSON(),
                tutors: subjectTutors.map(tutor => tutor.toJSON()),
                tutors_count: subjectTutors.length
            };
        } catch (error) {
            throw new Error(`Failed to get subject with tutors: ${error.message}`);
        }
    }

    async getPopularSubjects(limit = 5) {
        try {
            const subjects = await subjectRepository.findAll();

            // Получаем статистику по каждому предмету
            const subjectsWithStats = await Promise.all(
                subjects.map(async (subject) => {
                    const allTutors = await tutorRepository.findAll();
                    const subjectTutors = allTutors.filter(tutor => tutor.subject_id === subject.subject_id);

                    // Считаем общее количество уроков по предмету
                    let totalLessons = 0;
                    for (const tutor of subjectTutors) {
                        // Здесь нужен метод для подсчета уроков по tutor_id
                    }

                    return {
                        ...subject.toJSON(),
                        tutors_count: subjectTutors.length,
                        total_lessons: totalLessons
                    };
                })
            );

            // Сортируем по количеству репетиторов
            subjectsWithStats.sort((a, b) => b.tutors_count - a.tutors_count);

            return subjectsWithStats.slice(0, limit);
        } catch (error) {
            throw new Error(`Failed to get popular subjects: ${error.message}`);
        }
    }
}

module.exports = new SubjectService();