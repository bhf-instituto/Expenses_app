import { getRole } from '../repositories/set.repository.js';

const checkGroupAccess = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const setId = req.params.id_set;

        const groupRole = await getRole(setId, userId);


        if (!groupRole) return res.status(401).json({
            ok: false,
            data: {
                message: 'you dont belong to this set'
            }
        });

        req.user.set = {
            id : setId,
            role: groupRole.role
        }

        next()

    } catch (error) {
        console.log(error);
        
        return res.status(501).json({
            ok: false,
            data: {
                error: error.message
            }
        });
    }

    // next()
}

export { checkGroupAccess };