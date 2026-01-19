import { AppError } from "../errors/appError.js";
import { normString, validatePhone } from "../utils/validations.utils.js";
import { createProvider, getAllProvidersById, deleteProviderById, updateProvider } from '../repositories/provider.repository.js';

// export const edit = async (providerId, setId, data) => {

//     const updated = await updateProvider(
//         providerId,
//         setId,
//         data
//     );

//     if (!updated) {
//         throw new AppError(
//             'provider does not exist or access denied',
//             404
//         );
//     }

//     return updated;
// };

export const edit = async (providerId, setId, data) => {

    const updateData = {};
    let hasAnyInput = false;
    let hasAnyValidField = false;

    if (data.name !== undefined && data.name !== null && data.name !== '') {
        hasAnyInput = true;

        const normalized = normString(data.name, 3);
        if (normalized !== false) {
            updateData.name = normalized;
            hasAnyValidField = true;
        }
    }    
    
    if (data.contact_name !== undefined && data.contact_name !== null && data.contact_name !== '') {
        hasAnyInput = true;
        
        const normalized = normString(data.contact_name, 3);
        if (normalized !== false) {
            updateData.contact_name = normalized;
            hasAnyValidField = true;
        }
    }

    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
        hasAnyInput = true;

        const validated = validatePhone(data.phone);
        if (validated !== false) {
            updateData.phone = validated;
            hasAnyValidField = true;
        }
    }

    if (!hasAnyInput) {
        throw new AppError(
            'no fields provided to update',
            400
        );
    }

    if (!hasAnyValidField) {
        throw new AppError(
            'all provided fields are invalid',
            400
        );
    }

    const updated = await updateProvider(
        providerId,
        setId,
        updateData
    );

    if (!updated) {
        throw new AppError(
            'provider does not exist or access denied',
            404
        );
    }
    return updated;
};

export const del = async (providerId, setId) => {

    const result = await deleteProviderById(providerId, setId);

    if (!result) throw new AppError('provider does not exist or access denied', 403);

    return result;

}
export const getAll = async (setId) => {

    const result = await getAllProvidersById(setId);

    if (result.length === 0) return false;

    return result;
}

export const create = async (setId, name, contactName, phone) => {


    console.log('→ ', contactName);

    // REQUIRED
    const validName = normString(name, 3);
    if (!validName) {
        throw new AppError('invalid provider name', 400);
    }

    // OPTIONAL: contactName
    let validContactName = null;
    if (contactName !== undefined && contactName !== null && contactName !== '') {
        validContactName = normString(contactName, 3);
        if (!validContactName) {
            throw new AppError('invalid contact name format', 400);
        }
    }

    // OPTIONAL: phone
    let validPhone = null;
    if (phone !== undefined && phone !== null && phone !== '') {
        validPhone = validatePhone(phone);
        if (!validPhone) {
            throw new AppError('invalid phone format', 400);
        }
    }

    const result = await createProvider(
        setId,
        validName,
        validContactName,
        validPhone
    );

    if (!result) {
        throw new AppError('error creating a provider', 500);
    }

    return result;
};