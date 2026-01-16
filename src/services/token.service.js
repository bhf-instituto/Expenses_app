import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { deleteRefreshTokenByUserId, findRefreshTokenByUserId } from '../repositories/refreshToken.repository.js';
import { AppError } from '../errors/appError.js';

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

export const refreshAccessToken = async (refreshToken) => {
    let payload;
    try {

        payload = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch (err) {

        if (err.name === 'TokenExpiredError') {
            console.log("token.service.refreshAccessToken\n", err);

            // Decodamos sin verificar firma solo para obtener el user id
            const decoded = jwt.decode(refreshToken);

            if (decoded?.id) {
                await deleteRefreshTokenByUserId(decoded.id);
            }

            throw new AppError('Refresh token expired', 401);
        }

        // Cualquier otro error de JWT (firma inválida, token malformado, etc.)
        throw new AppError('Invalid refresh token', 401);
    }


    const hashedTokenInDb = await findRefreshTokenByUserId(payload.id);

    if (!hashedTokenInDb) throw new AppError('not refresh token in db', 404);

    const isValid = await bcrypt.compare(
        refreshToken,
        hashedTokenInDb.hashed_token
    );

    if (!isValid) {
        // reuse / token comprometido
        await deleteRefreshTokenByUserId(payload.id);
        throw new AppError('reused o suspicious token', 404);
    }

    const newAccessToken = jwt.sign(
        {
            id: payload.id,
            email: payload.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    return {
        accessToken: newAccessToken,
        user: {
            id: payload.id,
            email: payload.email
        }
    };
};