import * as authService from '../services/auth.service.js';

const setAuthCookies = (res, accessToken, refreshToken) => {
    res
        .cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 15
        })
        .cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });
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
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;

        await authService.logout(refreshToken);

        return res
            .clearCookie('access_token')
            .clearCookie('refresh_token')
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