import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { deleteRefreshTokenByUserId, findRefreshTokenByUserId } from '../repositories/refreshToken.repository.js';

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
        // console.log(payload);
    } catch (err) {
        // si expiró, lo limpiamos. Con decode leemos el header y payload 
        // pero sin verificar firmas. Porque si el checkeo dice que expiró
        // significa que el token era válido antes de expirar y el user_id
        // es correcto.
        if (err.name === 'TokenExpiredError') {
            console.log("token.service.refreshAccessToken\n", err);

            const decoded = jwt.decode(refreshToken);
            if (decoded?.id) {
                await deleteRefreshTokenByUserId(decoded.id);
            }
        }
        return null;
    }


    const hashedTokenInDb = await findRefreshTokenByUserId(payload.id);

    if (!hashedTokenInDb) return null;

    const isValid = await bcrypt.compare(
        refreshToken,
        hashedTokenInDb.hashed_token
    );

    if (!isValid) {
        // reuse / token comprometido
        await deleteRefreshTokenByUserId(payload.id);
        return null;
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