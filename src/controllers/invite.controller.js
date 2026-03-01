import * as inviteService from '../services/invite.service.js';

const createInvite = async (req, res) => {
    try {
        const setId = Number(req.params.id_set);
        const invitedUserEmail = req.body.email;

        if (!Number.isInteger(setId) || !invitedUserEmail) {
            return res.status(400).json({
                ok: false,
                data: {
                    message: 'set id and invited user email are required'
                }
            });
        }

        if (invitedUserEmail === req.user.email) {
            return res.status(400).json({
                ok: false,
                data: {
                    message: 'cant invite yourself'
                }
            });
        }

        const inviteToken = await inviteService.create(setId, invitedUserEmail);

        return res.status(200).json({
            ok: true,
            data: {
                invite_token: inviteToken,
                message: 'invite token created correctly'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const acceptInvite = async (req, res) => {
    try {
        const inviteToken = req.body.invite_token;
        const userId = req.user.id;

        if (!inviteToken) {
            return res.status(400).json({
                ok: false,
                data: { message: 'all fields required' }
            });
        }

        const setId = await inviteService.accept(userId, inviteToken);

        return res.status(200).json({
            ok: true,
            data: {
                set_id: setId,
                message: 'added to group correctly as participant'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export { createInvite, acceptInvite };
