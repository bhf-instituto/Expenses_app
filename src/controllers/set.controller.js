import { checkCreatedSet, findSetsCreated, getUserRoleInSet } from '../repositories/set.repository.js'

const createSet = async (req, res) => {
    const setName = req.body.set_name;
    const userId = req.user.id;

    if(!setName) res.status(400).json({ ok: false, message: "missing set_name" });

    const userRoleAtGroup = await getUserRoleInSet(userId, setName);

    // console.log(userRoleAtGroup);

    // const setExists = await checkCreatedSet(userId, setName);

    // if (setExists) return res.status(400).json({ ok: false, message: "group exists, created by you" });



    return res.status(200).json({ ok: true, userRole: userRoleAtGroup })
}

export { createSet }