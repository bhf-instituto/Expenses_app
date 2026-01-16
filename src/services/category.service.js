import { normString } from "../utils/validations.utils.js";
import { findCategoryById, findCategoryByUnique, createCategory, getAllFromSet, editCategory } from '../repositories/category.repository.js'
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

export const edit = async (categoryId, categoryName, setId, changeType) => {

    const category = await findCategoryById(categoryId, setId);

    if (!category) throw new AppError('category doesnt exist')

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

export const getAll = async (setId, expenseType) => {

    // const expenseType_ = Number(expenseType);

    // console.log(expenseType_);

    // verifico si pertenece a los valores de EXPENSE_TYPE
    if (!Object.values(EXPENSE_TYPE).includes(expenseType))
        expenseType = undefined;

    const categories = await getAllFromSet(setId, expenseType);

    return categories;
}

