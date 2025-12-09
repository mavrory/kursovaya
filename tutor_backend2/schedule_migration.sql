-- ==============================
-- Таблица расписания репетитора
-- Хранит заблокированные и доступные слоты времени
-- ==============================
CREATE TABLE tutor_schedule (
    schedule_id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'blocked'
        CHECK (status IN ('available', 'blocked')),
    reason TEXT, -- Причина блокировки (опционально)
    is_recurring BOOLEAN DEFAULT FALSE, -- Повторяющийся слот (например, каждый понедельник)
    recurring_pattern VARCHAR(50), -- Паттерн повторения (например, 'weekly', 'daily')
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальность: один репетитор не может иметь два одинаковых слота
    UNIQUE(tutor_id, schedule_date, start_time)
);

-- Индексы для ускорения выборок
CREATE INDEX idx_tutor_schedule_tutor_date ON tutor_schedule(tutor_id, schedule_date);
CREATE INDEX idx_tutor_schedule_status ON tutor_schedule(status);
CREATE INDEX idx_tutor_schedule_date ON tutor_schedule(schedule_date);

-- Комментарии к таблице
COMMENT ON TABLE tutor_schedule IS 'Расписание репетитора: заблокированные и доступные слоты времени';
COMMENT ON COLUMN tutor_schedule.status IS 'Статус слота: available - доступен для бронирования, blocked - заблокирован';
COMMENT ON COLUMN tutor_schedule.is_recurring IS 'Является ли слот повторяющимся';
COMMENT ON COLUMN tutor_schedule.recurring_pattern IS 'Паттерн повторения: weekly, daily, monthly и т.д.';

