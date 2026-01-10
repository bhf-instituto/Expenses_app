import {
    verifyAccessToken,
    refreshAccessToken
} from '../services/token.service.js';

const checkToken = async (req, res, next) => {
    req.user = null;

    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    if (accessToken) {
        try {
            const payload = verifyAccessToken(accessToken);
                        
            req.user = {
                id: payload.id,
                email: payload.email
            };
            return next();
        } catch {
            // access token inválido o expirado → seguimos
        }
    }

    if (!refreshToken) return next();

    try {
        // si no hay accessToken, pero si refreshToken, intento crear un
        // accessToken, verificado con el refreshToken.
        const result = await refreshAccessToken(refreshToken);
        if (!result) return next();

        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 15
        });

        req.user = result.user;
        return next();

    } catch {
        return next();
    }
};

export default checkToken;