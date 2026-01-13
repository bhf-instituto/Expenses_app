import { normString } from "../utils/validations.utils.js"
import { isUserInSet_name } from '../repositories/set.repository.js'
import { createSet } from "../repositories/set.repository.js";

const create = async (userId, setName) => {
    const normSetName = normString(setName);
    if (!normSetName) throw { status: 401, message: 'need set name' };

    const setExists = await isUserInSet_name(userId, setName);

    if (setExists) throw { status: 401, message: 'youre participant of this group ' };
    const setId = await createSet(normSetName, userId);

    return {
        set: {
            id: setId,
            name: normSetName
        }
    }

}

export { create }