import jwt from 'jsonwebtoken';
import { findRefreshToken } from '../repositories/refreshToken.repository.js';

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

export const refreshAccessToken = async (refreshToken) => {
    const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
    );

    const tokenInDb = await findRefreshToken(refreshToken);
    if (!tokenInDb) return null;

    const newAccessToken = jwt.sign(
        {
            id_user: payload.id_user,
            email: payload.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    return {
        accessToken: newAccessToken,
        user: {
            id_user: payload.id_user,
            email: payload.email
        }
    };
};
