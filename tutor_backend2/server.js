require('dotenv').config();
console.log('Environment loaded from .env file');

const app = require("./src/app");
const { lessonService } = require("./src/services");
const PORT = process.env.PORT || 5000;

// Автоматическое завершение уроков каждые 5 минут
const AUTO_COMPLETE_INTERVAL = 5 * 60 * 1000; // 5 минут

async function autoCompleteLessons() {
    try {
        const result = await lessonService.autoCompleteLessons();
        if (result.completed > 0) {
            console.log(`✅ Auto-completed ${result.completed} lessons`);
        }
    } catch (error) {
        console.error('❌ Error in auto-complete lessons:', error);
    }
}

// Запускаем автоматическое завершение при старте сервера
autoCompleteLessons();

// И затем каждые 5 минут
setInterval(autoCompleteLessons, AUTO_COMPLETE_INTERVAL);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Auto-complete lessons task scheduled (every ${AUTO_COMPLETE_INTERVAL / 1000 / 60} minutes)`);
});
