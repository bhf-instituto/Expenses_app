import * as inviteService from '../services/invite.service.js'
import { normString } from '../utils/validations.utils.js';

const createInvite = async (req, res) => {
    //espero id_group en param /:id_group
    // y email de invited user del body

    try {
        const userId = req.user.id;
        const setId = req.params.id_set;
        const invitedUserEmail = normString(req.body.email);

        if (!invitedUserEmail) return res.status(401).json({
            ok: false,
            data: {
                message: 'invited user`s email needed'
            }
        });

        if (invitedUserEmail === req.user.email) return res.status(401).json({
            ok: false,
            data: {
                message: 'cant invite yourself'
            }
        });

        const result = await inviteService.create(userId, setId, invitedUserEmail);

        return res.status(200).json({ ok: true, invite_token: result})

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' },
        });
    }



    // return res.json({ data: req.user })
};

const acceptInvite = async (req, res) => {
    // espero el invite_token desde el body
    try {
        const inviteToken  = req.body.invite_token;

        if (!inviteToken) return res.status(400).json({
            ok: false,
            data: { message: 'all fields required' }
        });

        const result = await inviteService.accept(inviteToken);

        if(!result) return res.status(400).json({
            ok: false,
            data: { message: 'invalid token' }
        });

        return res.status(200).json({ data: "nothing yet" })

    } catch (error) {

        console.log(error)
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};


export { createInvite, acceptInvite };