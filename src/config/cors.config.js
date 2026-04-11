import { configDotenv } from 'dotenv';
import { AppError } from '../errors/appError.js';

configDotenv();

const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.0.17:5174',
    'https://bhf-instituto.github.io',
    'https://m-bauhoffer.github.io'
];

const CORS_METHODS = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
const CORS_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Refresh-Token'];

const normalizeOrigin = (origin) => {
    if (typeof origin !== 'string') return '';
    return origin.trim().replace(/\/+$/, '');
};

const resolveAllowedOrigins = () => {
    const rawOrigins = process.env.CORS_ALLOWED_ORIGINS;
    const defaultOrigins = DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin);

    if (!rawOrigins) return defaultOrigins;

    const origins = rawOrigins
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    if (origins.length === 0) return defaultOrigins;

    return Array.from(new Set([
        ...defaultOrigins,
        ...origins
    ]));
};

const getAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return null;

    return resolveAllowedOrigins().includes(normalizedOrigin)
        ? normalizedOrigin
        : null;
};

const appendVaryHeader = (res, value) => {
    const currentValue = res.getHeader('Vary');
    if (!currentValue) {
        res.setHeader('Vary', value);
        return;
    }

    const varyValues = String(currentValue)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    if (!varyValues.includes(value)) {
        res.setHeader('Vary', [...varyValues, value].join(', '));
    }
};

const applyCorsHeaders = (req, res) => {
    const allowedOrigin = getAllowedOrigin(req.headers.origin);
    if (!allowedOrigin) return;

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', CORS_METHODS.join(','));
    res.setHeader('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS.join(','));
    appendVaryHeader(res, 'Origin');
};

const corsConfig = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigin = getAllowedOrigin(origin);
        if (allowedOrigin) return callback(null, true);

        return callback(new AppError(`Origin ${normalizeOrigin(origin)} not allowed by CORS`, 403));
    },
    credentials: true,
    methods: CORS_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    optionsSuccessStatus: 204
};

export {
    applyCorsHeaders,
    normalizeOrigin,
    resolveAllowedOrigins
};

export default corsConfig;
