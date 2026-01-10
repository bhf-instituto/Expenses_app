import { findGroupUser } from '../repositories/set.repository.js';

const checkGroupAccess = async (req, res, next) => {
    const userId = req.user.id;
    const groupId = req.params.id_group;

    const isAllawedAtGroup = await findGroupUser(groupId, userId);

    if (!isAllawedAtGroup) return res.status(400).json({ ok: false })

    next()
}

export { checkGroupAccess };