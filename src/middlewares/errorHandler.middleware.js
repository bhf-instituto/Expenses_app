import { AppError } from "../errors/appError.js";

export const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            ok: false,
            message: err.message
        })
    }

    console.error(err);

    return res.status(500).json({
        ok: false,
        message: 'internal service error'
    })
}

