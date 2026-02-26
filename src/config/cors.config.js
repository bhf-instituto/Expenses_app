const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://bhf-instituto.github.io'
];

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, '');

const parseAllowedOrigins = () => {
    const rawOrigins = process.env.CORS_ALLOWED_ORIGINS;

    if (!rawOrigins) return DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin);

    const origins = rawOrigins
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    if (origins.length === 0) {
        return DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin);
    }

    return Array.from(new Set([
        ...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin),
        ...origins
    ]));
};

const allowedOrigins = parseAllowedOrigins();

const corsConfig = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const normalizedOrigin = normalizeOrigin(origin);

        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${normalizedOrigin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

export default corsConfig;
