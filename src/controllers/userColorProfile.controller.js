import * as userColorProfileService from '../services/userColorProfile.service.js';

export const getMyColorProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const profile = await userColorProfileService.getMyColorProfile({ userId });

        return res.status(200).json({
            ok: true,
            data: {
                profile
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export const upsertMyColorProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { settings } = req.body || {};
        const profile = await userColorProfileService.saveMyColorProfile({
            userId,
            settings
        });

        return res.status(200).json({
            ok: true,
            data: {
                message: 'color profile saved',
                profile
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};
