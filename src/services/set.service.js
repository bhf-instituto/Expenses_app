import { normString } from '../utils/validations.utils.js';
import {
    getAllSetsById,
    isUserInSet_name,
    editSetName,
    deleteSet,
    createSet,
    getSetById
} from '../repositories/set.repository.js';
import { AppError } from '../errors/appError.js';

export const create = async (userId, setName) => {
    const normSetName = normString(setName);

    if (!normSetName) throw new AppError('invalid set name', 400);

    const setExists = await isUserInSet_name(userId, normSetName);
    if (setExists) throw new AppError('youre participant of this set', 409);

    const setId = await createSet(normSetName, userId);

    return {
        set: {
            id: setId,
            name: normSetName
        }
    };
};

export const edit = async (setId, setName_) => {
    const setName = normString(setName_);
    if (!setName) throw new AppError('invalid set name', 400);

    return editSetName(setId, setName);
};

export const del = async (setId) => {
    const deleted = await deleteSet(setId);
    if (!deleted) throw new AppError('set not found', 404);

    return true;
};

export const getSet = async (setId) => {
    const userSet = await getSetById(setId);
    if (!userSet) throw new AppError('set does not exist', 404);

    return userSet;
};

export const getAll = async (userId) => {
    return getAllSetsById(userId);
};
