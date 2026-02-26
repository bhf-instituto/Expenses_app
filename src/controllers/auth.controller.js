import * as authService from '../services/auth.service.js';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax'
};

const setAuthCookies = (res, accessToken, refreshToken) => {
    if (accessToken) {
        res.cookie('access_token', accessToken, {
            ...baseCookieOptions,
            maxAge: 1000 * 60 * 15
        });
    }

    if (refreshToken) {
        res.cookie('refresh_token', refreshToken, {
            ...baseCookieOptions,
            maxAge: 1000 * 60 * 60 * 24 * 7
        });
    }
};


export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                data: { message: 'all fields required' }
            });
        }

        const result = await authService.register(email, password);
        setAuthCookies(res, result.accessToken, result.refreshToken);

        return res.status(201).json({
            ok: true,
            data: {
                message: 'user created correctly',
                user: result.user
            }
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                data: { message: 'all fields required' }
            });
        }
          
        const result = await authService.login(email, password);
        setAuthCookies(res, result.accessToken, result.refreshToken);

        return res.json({
            ok: true,
            data: {
                message: 'login ok',
                user: result.user
            }
        });

    } catch (error) {
        console.log(error);
        
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const userId = req.user.id;

        await authService.logout(userId);

        return res
            .clearCookie('access_token', baseCookieOptions)
            .clearCookie('refresh_token', baseCookieOptions)
            .json({
                ok: true,
                data: {
                    message: 'logout successful'
                }
            });


    } catch (error) {
        return res.status(500).json({
            ok: false,
            data: {
                message: 'internal service error'
            }
        });
    }
}
