import SET_ROLE from '../constants/setRoles.js';
import { getRole } from '../repositories/set.repository.js';

const checkSetAccess = (onlyAdmin = false, setContext = false) => {
    return async (req, res, next) => {
        try {

            const userId = req.user.id;
            let setId;

            if (setContext) {
                setId = req.set.id;
            } else {
                setId = req.params.id_set;
            }

            let role;
            if (req.set?.role !== undefined) {
                role = req.set.role;
            }
            else {
                role = await getRole(setId, userId);
            }


            if (role !== SET_ROLE.ADMIN && role !== SET_ROLE.PARTICIPANT) {
                return res.status(403).json({
                    ok: false,
                    data: {
                        message: 'set does not exists or you dont belong to it'
                    }
                });
            }

            if (onlyAdmin && Number(role) !== SET_ROLE.ADMIN) {
                return res.status(403).json({
                    ok: false,
                    data: {
                        message: 'admin privileges required'
                    }
                });
            }

            req.set = {
                id: setId,
                role: role
            };

            next();

        } catch (error) {
            next();
        }

    }

}

// const checkGroupAccess = async (req, res, next) => {
//     try {

//         const userId = req.user.id;
//         const setId = req.params.id_set;

//         const role = await getRole(setId, userId);

//         if (role === null || role === undefined) {
//             return res.status(403).json({
//                 ok: false,
//                 data: {
//                     message: 'you dont belong to this set'
//                 }
//             });
//         }

//         req.user.set = {
//             id: setId,
//             role: role
//         }
//         next()

//     } catch (error) {

//         return res.status(501).json({
//             ok: false,
//             data: {
//                 error: error.message
//             }
//         });
//     }
// }

export { checkSetAccess };