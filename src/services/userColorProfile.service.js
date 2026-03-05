import { AppError } from '../errors/appError.js';
import {
    getColorProfileByUserId,
    upsertColorProfileByUserId
} from '../repositories/userColorProfile.repository.js';

const MAX_SETTINGS_JSON_LENGTH = 20000;

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const parseStoredSettings = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return isPlainObject(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return isPlainObject(value) ? value : null;
};

const normalizeUserId = (userId) => {
    const normalized = Number(userId);
    if (!Number.isInteger(normalized) || normalized <= 0) {
        throw new AppError('invalid user id', 400);
    }
    return normalized;
};

const normalizeSettingsPayload = (settings) => {
    if (!isPlainObject(settings)) {
        throw new AppError('invalid settings payload', 400);
    }

    const serialized = JSON.stringify(settings);
    if (!serialized || serialized === '{}') {
        throw new AppError('settings cannot be empty', 400);
    }

    if (serialized.length > MAX_SETTINGS_JSON_LENGTH) {
        throw new AppError('settings payload too large', 400);
    }

    return serialized;
};

export const getMyColorProfile = async ({ userId }) => {
    const normalizedUserId = normalizeUserId(userId);
    const profile = await getColorProfileByUserId(normalizedUserId);

    if (!profile) {
        return null;
    }

    return {
        user_id: Number(profile.user_id),
        settings: parseStoredSettings(profile.settings_json),
        updated_at: profile.updated_at
    };
};

export const saveMyColorProfile = async ({ userId, settings }) => {
    const normalizedUserId = normalizeUserId(userId);
    const settingsJson = normalizeSettingsPayload(settings);
    await upsertColorProfileByUserId(normalizedUserId, settingsJson);
    return await getMyColorProfile({ userId: normalizedUserId });
};
