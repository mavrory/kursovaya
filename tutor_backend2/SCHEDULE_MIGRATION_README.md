# Инструкция по добавлению таблицы расписания в базу данных

## Что было добавлено

Для полноценной работы системы расписания репетитора была создана новая таблица `tutor_schedule`, которая хранит заблокированные и доступные слоты времени.

## Таблица для добавления в БД

Выполните SQL-скрипт из файла `schedule_migration.sql` в вашей базе данных PostgreSQL.

### Структура таблицы `tutor_schedule`:

- **schedule_id** (SERIAL PRIMARY KEY) - уникальный идентификатор слота
- **tutor_id** (INT) - ID репетитора (ссылка на user.user_id)
- **schedule_date** (DATE) - дата слота
- **start_time** (TIME) - время начала слота
- **end_time** (TIME) - время окончания слота
- **status** (VARCHAR(20)) - статус слота: 'available' или 'blocked'
- **reason** (TEXT) - причина блокировки (опционально)
- **is_recurring** (BOOLEAN) - является ли слот повторяющимся
- **recurring_pattern** (VARCHAR(50)) - паттерн повторения (weekly, daily, monthly)
- **date_created** (TIMESTAMP) - дата создания
- **date_updated** (TIMESTAMP) - дата последнего обновления

### Ограничения:

- Уникальность: один репетитор не может иметь два одинаковых слота на одну дату и время
- Статус может быть только 'available' или 'blocked'

## Как применить миграцию

### Вариант 1: Через psql

```bash
psql -U your_username -d your_database_name -f schedule_migration.sql
```

### Вариант 2: Через pgAdmin или другой GUI

1. Откройте pgAdmin или другой клиент PostgreSQL
2. Подключитесь к вашей базе данных
3. Откройте файл `schedule_migration.sql`
4. Выполните скрипт (F5 или кнопка "Execute")

### Вариант 3: Через командную строку PostgreSQL

```sql
\i schedule_migration.sql
```

## Что было обновлено в коде

1. ✅ Создана модель `TutorSchedule` (`src/models/TutorSchedule.js`)
2. ✅ Создан репозиторий `tutorScheduleRepository` (`src/repositories/tutorSchedule.repository.js`)
3. ✅ Обновлен сервис `tutorService` для работы с заблокированными слотами
4. ✅ Обновлен контроллер `tutorController` для сохранения блокировок в БД
5. ✅ Метод `getTutorSchedule` теперь включает заблокированные слоты из таблицы
6. ✅ Метод `blockTime` теперь сохраняет блокировки в базу данных

## Функциональность

После применения миграции:

- **GET /api/tutor/schedule** - возвращает расписание репетитора, включая:
  - Запланированные уроки (из таблицы `lesson`)
  - Pending запросы (из таблицы `lesson_request`)
  - Заблокированные слоты (из таблицы `tutor_schedule`)

- **POST /api/tutor/schedule/block** - блокирует указанные временные слоты и сохраняет их в БД

## Проверка

После применения миграции проверьте, что таблица создана:

```sql
SELECT * FROM tutor_schedule LIMIT 5;
```

Если запрос выполняется без ошибок, миграция применена успешно!

