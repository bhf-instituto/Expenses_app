import { normString } from "../utils/validations.utils.js"
import { getAllSetsById, isUserInSet_name } from '../repositories/set.repository.js'
import { createSet } from "../repositories/set.repository.js";

export const create = async (userId, setName) => {
    const normSetName = normString(setName);
    if (!normSetName) throw { status: 401, message: 'need set name' };

    const setExists = await isUserInSet_name(userId, setName);

    if (setExists) throw { status: 401, message: 'youre participant of this set ' };
    const setId = await createSet(normSetName, userId);

    return {
        set: {
            id: setId,
            name: normSetName
        }
    }

}

export const getAll = async (userId) => {
    const userSets = await getAllSetsById(userId);

    if(!userSets.has) throw { status: 401, message: 'user is not participant of any set'};
    
    return userSets.sets;
}

// export { create, get }