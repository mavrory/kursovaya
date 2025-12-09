-- ==============================
-- Миграция: Добавление lesson_id в таблицы review и survey
-- ==============================

-- Добавляем lesson_id в таблицу review
ALTER TABLE review 
ADD COLUMN IF NOT EXISTS lesson_id INT REFERENCES lesson(lesson_id) ON DELETE CASCADE;

-- Добавляем lesson_id в таблицу survey
ALTER TABLE survey 
ADD COLUMN IF NOT EXISTS lesson_id INT REFERENCES lesson(lesson_id) ON DELETE CASCADE;

-- Создаем индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_review_lesson_id ON review(lesson_id);
CREATE INDEX IF NOT EXISTS idx_survey_lesson_id ON survey(lesson_id);

-- Комментарии
COMMENT ON COLUMN review.lesson_id IS 'Связь с уроком, для которого оставлен отзыв';
COMMENT ON COLUMN survey.lesson_id IS 'Связь с уроком, для которого заполнен опрос';

