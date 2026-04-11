import { AppError } from "../errors/appError.js";
import { applyCorsHeaders } from "../config/cors.config.js";

export const errorHandler = (err, req, res, next) => {
    applyCorsHeaders(req, res);

    if (err instanceof AppError) {
        return res.status(err.status).json({
            ok: false,
            data: { message: err.message }
        })
    }

    console.error(err);

    return res.status(500).json({
        ok: false,
        data: { message: 'internal service error' }
    })
}

