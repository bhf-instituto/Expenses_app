import { getRole } from '../repositories/set.repository.js';

const checkGroupAccess = async (req, res, next) => {
    try {

        const userId = req.user.id;
        const setId = req.params.id_set;

        const role = await getRole(setId, userId);

        console.log("→→" + role);

        if (role === null || role === undefined) {
            return res.status(401).json({
                ok: false,
                data: {
                    message: 'you dont belong to this set'
                }
            });
        }

        // if (!role) return res.status(401).json({
        //     ok: false,
        //     data: {
        //         message: 'you dont belong to this set'
        //     }
        // });

        req.user.set = {
            id: setId,
            role: role
        }

        // console.log("→→" + req.user.set.role );

        next()

    } catch (error) {
        // console.log(error);

        return res.status(501).json({
            ok: false,
            data: {
                error: error.message
            }
        });
    }
}

export { checkGroupAccess };