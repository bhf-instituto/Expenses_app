import { normString, validateExpenseType } from "../utils/validations.utils.js";
import { findCategoryById, findCategoryByUnique, createCategory, getAllFromSet, editCategory, deleteCategoryById } from '../repositories/category.repository.js'
import { AppError } from '../errors/appError.js';
import EXPENSE_TYPE from "../constants/expenseTypes.constant.js";


export const create = async (setId, expenseType_, categoryName) => {

    const normName = normString(categoryName);

    if (!normName) throw new AppError('invalid category name', 400);

    const expenseType = Number(expenseType_);

    // verifico si pertenece a los valores de EXPENSE_TYPE
    if (!Object.values(EXPENSE_TYPE).includes(expenseType))
        throw new AppError('invalid category type', 400);

    const categoryExist = await findCategoryByUnique(setId, expenseType, normName);

    if (categoryExist) throw new AppError('category already exists', 409)

    const result = await createCategory(setId, normName, expenseType)

    if (!result) throw new AppError('error creating category', 500)

    return result;
}

export const edit = async (categoryId, categoryName, changeType) => {

    const validName = normString(categoryName, 3);
    const category = await findCategoryById(categoryId);

    if(!validName) throw new AppError('invalid category name', 400)
    if (!category) throw new AppError('category doesnt exist', 400)

    let newExpenseType = null;

    if (changeType === true) {
        newExpenseType =
            category.expense_type === EXPENSE_TYPE.FIJO
                ? EXPENSE_TYPE.VARIABLE
                : EXPENSE_TYPE.FIJO;
    }


    const result = await editCategory(
        categoryId,
        categoryName,
        newExpenseType
    );

    if (result === 0) throw new AppError('editing category failed');

    return true;

}

export const del = async (categoryId, setId) => {

    const result = await deleteCategoryById(categoryId, setId);

    if(!result) throw new AppError('Error deleting category')

    return result;
}
export const getAll = async (setId, expenseType) => {

    // aca normalizo, si no es válido devuelve undefined y no rompe la 
    // query getAllFromSet, ya que ambas opciones son válidas.
    const validExpenseType = validateExpenseType(expenseType);

    const categories = await getAllFromSet(setId, validExpenseType);

    return categories;
}

