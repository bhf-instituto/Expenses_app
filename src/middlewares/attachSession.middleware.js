import {
    verifyAccessToken,
    refreshAccessToken
} from '../services/token.service.js';

const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 15
};

const attachSession = async (req, res, next) => {
    req.user = null;

    const accessToken = req.cookies?.access_token;

    // esto evita que pase un string == "undefined"
    const refreshToken =
        typeof req.cookies?.refresh_token === 'string' &&
            req.cookies.refresh_token !== 'undefined'
            ? req.cookies.refresh_token
            : null;

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


    // no hay tokens, no hay sesión.
    if (!refreshToken) return next();


    try {
        // si no hay accessToken, pero si refreshToken, intento crear un
        // accessToken, verificado con el refreshToken.
        const result = await refreshAccessToken(refreshToken);
        if (!result) return next();

        res.cookie('access_token', result.accessToken, accessCookieOptions);

        req.user = result.user;
        return next();

    } catch {
        return next();
    }
};

export default attachSession;
