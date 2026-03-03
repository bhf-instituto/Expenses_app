import { normString } from '../utils/validations.utils.js';
import {
    getAllSetsById,
    isUserInSet_name,
    editSetName,
    deleteSet,
    createSet,
    getSetById,
    getUsersBySetId,
    getSetUserMembership,
    removeUserFromSet
} from '../repositories/set.repository.js';
import { AppError } from '../errors/appError.js';
import SET_ROLE from '../constants/setRoles.js';

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

export const getUsers = async (setId) => {
    return getUsersBySetId(setId);
};

export const removeUser = async (setId, targetUserId, requesterUserId, { deleteExpenses = false } = {}) => {
    const normalizedSetId = Number(setId);
    const normalizedTargetUserId = Number(targetUserId);
    const normalizedRequesterUserId = Number(requesterUserId);

    if (!Number.isInteger(normalizedSetId) || normalizedSetId <= 0) {
        throw new AppError('invalid set id', 400);
    }

    if (!Number.isInteger(normalizedTargetUserId) || normalizedTargetUserId <= 0) {
        throw new AppError('invalid user id', 400);
    }

    if (!Number.isInteger(normalizedRequesterUserId) || normalizedRequesterUserId <= 0) {
        throw new AppError('invalid requester user id', 400);
    }

    if (normalizedTargetUserId === normalizedRequesterUserId) {
        throw new AppError('admin cannot remove self from group', 400);
    }

    const membership = await getSetUserMembership(normalizedSetId, normalizedTargetUserId);
    if (!membership) {
        throw new AppError('user does not belong to this group', 404);
    }

    if (Number(membership.role) === SET_ROLE.ADMIN) {
        throw new AppError('cannot remove admin user from group', 400);
    }

    const result = await removeUserFromSet(normalizedSetId, normalizedTargetUserId, Boolean(deleteExpenses));
    if (!result?.removed) {
        throw new AppError('user does not belong to this group', 404);
    }

    return {
        removed_user_id: normalizedTargetUserId,
        deleted_expenses: Number(result.deletedExpenses || 0)
    };
};
