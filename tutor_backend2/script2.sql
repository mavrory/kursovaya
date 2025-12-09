-- ==============================
-- 1. Таблица ролей пользователей
-- ==============================
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- ==============================
-- 2. Таблица пользователей
-- ==============================
CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES role(role_id) ON DELETE RESTRICT,
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- 3. Таблица предметов
-- ==============================
CREATE TABLE subject (
    subject_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- ==============================
-- 4. Профиль репетитора (1:1 с users)
-- ==============================
CREATE TABLE tutor_profile (
    tutor_id INT PRIMARY KEY REFERENCES "user"(user_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subject(subject_id) ON DELETE SET NULL,
    experience INT CHECK (experience >= 0),
    price_per_hour NUMERIC(8,2) CHECK (price_per_hour >= 0),
    rating_avg NUMERIC(3,2) DEFAULT 0
);

-- ==============================
-- 5. Запрос на проведение урока
-- ==============================
CREATE TABLE lesson_request (
    request_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subject(subject_id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','rejected','completed')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- 6. Проведённые / запланированные уроки
-- ==============================
CREATE TABLE lesson (
    lesson_id SERIAL PRIMARY KEY,
    request_id INT UNIQUE REFERENCES lesson_request(request_id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE
);

-- ==============================
-- 7. Запросы на изменение урока
-- ==============================
CREATE TABLE lesson_change_request (
    change_id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
    requester_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    
    proposed_date DATE,
    proposed_time TIME,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','rejected')),
    comment TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- 8. Отзывы о репетиторах
-- ==============================
CREATE TABLE review (
    review_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- 9. Опросы удовлетворённости
-- ==============================
CREATE TABLE survey (
    survey_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,          -- кто заполнил
    target_user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,   -- кого оценивают
    satisfaction_level INT CHECK (satisfaction_level BETWEEN 1 AND 5),
    knowledge_growth INT CHECK (knowledge_growth BETWEEN 1 AND 5),
    comment TEXT,
    survey_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- 10. Аналитические отчёты администратора
-- ==============================
CREATE TABLE analytics_report (
    report_id SERIAL PRIMARY KEY,
    generated_by INT REFERENCES "user"(user_id) ON DELETE SET NULL,
    date_generated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avg_rating NUMERIC(4,2),
    avg_satisfaction NUMERIC(4,2),
    top_tutor_id INT REFERENCES "user"(user_id) ON DELETE SET NULL
);

-- ==============================
-- Индексы для ускорения выборок
-- ==============================
CREATE INDEX idx_users_role ON "user"(role_id);
CREATE INDEX idx_lesson_request_status ON lesson_request(status);
CREATE INDEX idx_review_tutor ON review(tutor_id);
CREATE INDEX idx_lesson_tutor_date ON lesson(tutor_id, lesson_date);
CREATE INDEX idx_survey_target ON survey(target_user_id);
CREATE INDEX idx_lesson_change_status ON lesson_change_request(status);



