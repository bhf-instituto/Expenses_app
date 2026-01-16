import { normString } from "../utils/validations.utils.js"
import { getAllSetsById, isUserInSet_name, editSetName, deleteSet, createSet, getSetById } from '../repositories/set.repository.js'

import { AppError } from '../errors/appError.js';


export const create = async (userId, setName) => {

    const normSetName = normString(setName);

    if (!normSetName) throw new AppError('invalid set name', 400);

    const setExists = await isUserInSet_name(userId, normSetName);

    if (setExists) throw new AppError('youre participant of this set', 404)

    const setId = await createSet(normSetName, userId);

    return {
        set: {
            id: setId,
            name: normSetName
        }
    }
}

export const edit = async (setId, setName_) => {
    const setName = normString(setName_);

    if (!setName) throw new AppError('invalid set name', 400)

    const result = await editSetName(setId, setName);

    return result;
}

export const del = async (setId) => {

    const deleted = await deleteSet(setId);

    if (!deleted) throw new AppError('set not found', 404)

    return true;
}
export const getSet = async (userId) => {
    const userSet = await getSetById(userId);

    console.log("→→ ", userSet);


    if (!userSet) throw new AppError('set does not exist for you')


    // if(!userSets.has) throw new AppError('user is no participant of any set', 404)

    return userSet;
}

export const getAll = async (userId) => {
    const userSets = await getAllSetsById(userId);

    if (userSets.length === 0) throw new AppError('user is no participant of any set', 404)

    return userSets;
}
