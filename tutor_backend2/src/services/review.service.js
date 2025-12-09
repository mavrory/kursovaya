const { reviewRepository, userRepository, tutorRepository, lessonRepository } = require('../repositories');

class ReviewService {
    async createReview(reviewData) {
        try {
            const { student_id, lesson_id, rating, comment } = reviewData;

            // Проверяем существование студента
            const student = await userRepository.findById(student_id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Получаем урок
            const lesson = await lessonRepository.findById(lesson_id);
            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // Проверяем, что урок завершен
            if (!lesson.is_completed) {
                throw new Error('Can only review completed lessons');
            }

            // Проверяем, что студент является участником урока
            if (lesson.student_id !== student_id) {
                throw new Error('Student is not part of this lesson');
            }

            const tutor_id = lesson.tutor_id;

            // Проверяем, не оставлял ли уже студент отзыв для этого урока
            const existingReview = await this.checkExistingReviewForLesson(student_id, lesson_id);
            if (existingReview) {
                throw new Error('You have already reviewed this lesson');
            }

            // Создаем отзыв
            const review = await reviewRepository.create({
                student_id,
                tutor_id,
                lesson_id,
                rating,
                comment
            });

            // Обновляем рейтинг репетитора
            await this.updateTutorRating(tutor_id);

            return review;
        } catch (error) {
            throw new Error(`Failed to create review: ${error.message}`);
        }
    }

    async checkIfLessonCompleted(student_id, tutor_id) {
        try {
            const lessons = await lessonRepository.findByStudent(student_id);
            return lessons.some(lesson =>
                lesson.tutor_id === tutor_id && lesson.is_completed
            );
        } catch (error) {
            return false;
        }
    }

    async checkExistingReview(student_id, tutor_id) {
        try {
            const reviews = await reviewRepository.findByStudent(student_id);
            return reviews.find(review => review.tutor_id === tutor_id);
        } catch (error) {
            return null;
        }
    }

    async getTutorReviews(tutor_id) {
        try {
            const tutor = await tutorRepository.findById(tutor_id);
            if (!tutor) {
                throw new Error('Tutor not found');
            }

            const reviews = await reviewRepository.findByTutor(tutor_id);
            const ratingStats = await reviewRepository.getTutorAverageRating(tutor_id);

            return {
                tutor: tutor.toJSON(),
                reviews,
                statistics: ratingStats
            };
        } catch (error) {
            throw new Error(`Failed to get tutor reviews: ${error.message}`);
        }
    }

    async getStudentReviews(student_id) {
        try {
            const student = await userRepository.findById(student_id);
            if (!student) {
                throw new Error('Student not found');
            }

            const reviews = await reviewRepository.findByStudentWithLessonInfo(student_id);
            
            // Преобразуем в формат, ожидаемый фронтендом
            const formattedReviews = reviews.map(review => {
                const reviewData = review.toJSON ? review.toJSON() : review;
                return {
                    review_id: reviewData.review_id,
                    lesson_id: reviewData.lesson_id,
                    tutor_id: reviewData.tutor_id,
                    tutor_name: reviewData.tutor_name || 'Неизвестный репетитор',
                    tutor_avatar: null, // Пока нет в БД
                    rating: reviewData.rating,
                    comment: reviewData.comment || '',
                    created_at: reviewData.date_posted ? new Date(reviewData.date_posted).toISOString() : null,
                    lesson_subject: reviewData.subject_name || 'Не указано'
                };
            });
            
            return formattedReviews;
        } catch (error) {
            console.error('Error in getStudentReviews:', error);
            throw new Error(`Failed to get student reviews: ${error.message}`);
        }
    }

    async checkExistingReviewForLesson(student_id, lesson_id) {
        try {
            const review = await reviewRepository.findByLesson(lesson_id);
            if (review && review.student_id === student_id) {
                return review;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async getLessonSubject(lesson_id) {
        try {
            const lesson = await lessonRepository.getLessonWithDetails(lesson_id);
            return lesson ? lesson.subject_name : null;
        } catch (error) {
            return null;
        }
    }

    async getCompletedLessonsWithoutReview(student_id) {
        try {
            // Получаем все завершенные уроки студента
            const lessons = await lessonRepository.findByStudent(student_id);
            const completedLessons = lessons.filter(l => l.is_completed);

            // Фильтруем уроки, для которых нет отзыва
            const lessonsWithoutReview = [];
            for (const lesson of completedLessons) {
                const existingReview = await this.checkExistingReviewForLesson(student_id, lesson.lesson_id);
                if (!existingReview) {
                    const lessonDetails = await lessonRepository.getLessonWithDetails(lesson.lesson_id);
                    lessonsWithoutReview.push({
                        lesson_id: lessonDetails.lesson_id,
                        tutor_id: lessonDetails.tutor_id,
                        tutor_name: lessonDetails.tutor_name,
                        subject_name: lessonDetails.subject_name,
                        completed_at: lessonDetails.is_completed ? new Date().toISOString() : null
                    });
                }
            }

            return lessonsWithoutReview;
        } catch (error) {
            throw new Error(`Failed to get completed lessons without review: ${error.message}`);
        }
    }

    async updateTutorRating(tutor_id) {
        try {
            const ratingStats = await reviewRepository.getTutorAverageRating(tutor_id);
            if (ratingStats.avg_rating) {
                // Обновляем рейтинг в профиле репетитора
                // Нужно добавить метод updateRating в TutorRepository
                // Пока просто возвращаем статистику
                return ratingStats;
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to update tutor rating: ${error.message}`);
        }
    }

    async updateReview(review_id, updateData, user_id) {
        try {
            const review = await reviewRepository.findById(review_id);
            if (!review) {
                throw new Error('Review not found');
            }

            // Проверяем, что пользователь - автор отзыва
            if (review.student_id !== user_id) {
                throw new Error('Not authorized to update this review');
            }

            return await reviewRepository.updateReview(review_id, updateData);
        } catch (error) {
            throw new Error(`Failed to update review: ${error.message}`);
        }
    }

    async deleteReview(review_id, user_id) {
        try {
            const review = await reviewRepository.findById(review_id);
            if (!review) {
                throw new Error('Review not found');
            }

            // Проверяем права (автор или администратор)
            if (review.student_id !== user_id) {
                // Здесь можно добавить проверку на роль администратора
                throw new Error('Not authorized to delete this review');
            }

            const deletedReview = await reviewRepository.delete(review_id);

            // Обновляем рейтинг репетитора
            if (deletedReview) {
                await this.updateTutorRating(deletedReview.tutor_id);
            }

            return deletedReview;
        } catch (error) {
            throw new Error(`Failed to delete review: ${error.message}`);
        }
    }
}

module.exports = new ReviewService();