import { normString } from "../utils/validations.utils.js";
import { findCategoryByUnique, createCategory, getAllFromSet } from '../repositories/category.repository.js'


export const create = async (setId, categoryType, categoryName) => {
    // ver si ya existe esta categoria (normalizar strings)
    const normName = normString(categoryName);

    if (normName.lenght < 6) return null;

    const categoryExist = await findCategoryByUnique(setId, categoryType, normName);

    if (categoryExist) throw { status: 403, message: 'category already exists' };

    const result = await createCategory(setId, categoryType, normName)

    if (!result) throw { status: 403, message: 'error creating category' };

    return result;
}

export const getAll = async (setId) => {
    
    const categories = await getAllFromSet(setId);

    if(categories.lenght == 0) throw { status: 403, message: 'theres no categories in this set'}
    
    return categories;

}