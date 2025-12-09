const errorHandler = (err, req, res, next) => {
    console.error('💥 Error:', err);

    // По умолчанию
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = null;

    // JWT ошибки
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Валидационные ошибки
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errors = Object.values(err.errors).map(error => error.message);
    }

    // Пользовательские ошибки
    if (err.statusCode) {
        statusCode = err.statusCode;
    }

    if (err.message) {
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        errors: errors,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;