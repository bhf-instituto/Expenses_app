import { findCategoryByIdAndSet } from '../repositories/category.repository.js';
import { findProviderByIdAndSet } from '../repositories/provider.repository.js';
import { getTotalsByCategory, getTotalsByProvider, getTotalsByType, getExpensesTotalsByFilters } from '../repositories/totalExpenses.repository.js';
import { createExpense, getExpensesByFilters, updateExpenseById, deleteExpenseById } from '../repositories/expense.repository.js';
import EXPENSE_TYPE from '../constants/expenseTypes.constant.js';
import { AppError } from '../errors/appError.js';
// import { getExpenseTotalsByFilter } from '../controllers/expenses.controller.js';

export const create = async ({
    setId,
    userId,
    category_id,
    amount,
    description = null,
    expense_date = null,
    provider_id = null
}) => {

    let validExpenseDate = expense_date;
    if (!validExpenseDate) {
        validExpenseDate = new Date().toISOString().split('T')[0];
    }

    const normAmount = Number(amount);
    if (!Number.isInteger(normAmount) || normAmount <= 0) {
        throw new AppError('invalid amount', 400);
    }

    const category = await findCategoryByIdAndSet(category_id, setId);
    if (!category) {
        throw new AppError('invalid category for this group', 400);
    }

    const expenseType = Number(category.expense_type);

    let validProviderId = null;

    if (provider_id !== undefined && provider_id !== null) {

        if (expenseType !== EXPENSE_TYPE.VARIABLE) {
            throw new AppError('fixed expenses cannot have provider', 400);
        }

        console.log(provider_id, setId);


        const provider = await findProviderByIdAndSet(provider_id, setId);
        if (!provider) {
            throw new AppError('invalid provider for this set', 400);
        }

        validProviderId = provider_id;
    }

    const result = await createExpense(
        setId,
        userId,
        category_id,
        expenseType,
        normAmount,
        description,
        validExpenseDate,
        validProviderId
    );
}

export const getAll = async ({
    setId,
    category_id,
    expense_type,
    user_id,
    from_date,
    to_date,
    page,
    limit
}) => {

    const filters = { setId };

    if (category_id !== undefined) {
        const catId = Number(category_id);
        if (!Number.isInteger(catId)) {
            throw new AppError('invalid category filter', 400);
        }
        filters.category_id = catId;
    }

    if (expense_type !== undefined) {
        const type = Number(expense_type);
        if (!Object.values(EXPENSE_TYPE).includes(type)) {
            throw new AppError('invalid expense type filter', 400);
        }
        filters.expense_type = type;
    }

    if (user_id !== undefined) {
        const uid = Number(user_id);
        if (!Number.isInteger(uid)) {
            throw new AppError('invalid user filter', 400);
        }
        filters.user_id = uid;
    }

    if (from_date !== undefined) {
        filters.from_date = from_date;
    }

    if (to_date !== undefined) {
        filters.to_date = to_date;
    }

    // 🆕 PAGINACIÓN
    const pageNumber = page !== undefined ? Number(page) : 1;
    const limitNumber = limit !== undefined ? Number(limit) : 20;

    if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
        throw new AppError('invalid page', 400);
    }

    if (!Number.isInteger(limitNumber) || limitNumber <= 0 || limitNumber > 100) {
        throw new AppError('invalid limit', 400);
    }

    filters.limit = limitNumber;
    filters.offset = (pageNumber - 1) * limitNumber;

    return await getExpensesByFilters(filters);
};

export const getTotalsByFilter = async ({
    setId,
    category_id,
    expense_type,
    user_id,
    from_date,
    to_date
}) => {

    const filters = { setId };

    if (category_id !== undefined) {
        const catId = Number(category_id);
        if (!Number.isInteger(catId)) {
            throw new AppError('invalid category filter', 400);
        }
        filters.category_id = catId;
    }

    if (expense_type !== undefined) {
        const type = Number(expense_type);
        if (!Object.values(EXPENSE_TYPE).includes(type)) {
            throw new AppError('invalid expense type filter', 400);
        }
        filters.expense_type = type;
    }

    if (user_id !== undefined) {
        const uid = Number(user_id);
        if (!Number.isInteger(uid)) {
            throw new AppError('invalid user filter', 400);
        }
        filters.user_id = uid;
    }

    if (from_date !== undefined) {
        filters.from_date = from_date;
    }

    if (to_date !== undefined) {
        filters.to_date = to_date;
    }


    return await getExpensesTotalsByFilters(filters);
};



export const getTotals = async ({ setId, from_date, to_date }) => {

    if (!from_date || !to_date) {
        throw new AppError('from_date and to_date are required', 400);
    }

    if (from_date && isNaN(Date.parse(from_date))) {
        throw new AppError('invalid from_date format', 400);
    }

    if (to_date && isNaN(Date.parse(to_date))) {
        throw new AppError('invalid to_date format', 400);
    }

    return {
        by_category: await getTotalsByCategory(setId, from_date, to_date),
        by_provider: await getTotalsByProvider(setId, from_date, to_date),
        by_type: await getTotalsByType(setId, from_date, to_date)
    };
};

export const update = async (expenseId, data) => {

    const fields = {};
    // const values = [];


    if (data.amount !== undefined) {
        const amount = Number(data.amount);
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new AppError('invalid amount', 400);
        }
        fields.amount = amount;
    }

    if (data.description !== undefined) {
        fields.description = data.description || null;
    }

    if (data.expense_date !== undefined) {
        fields.expense_date = data.expense_date;
    }

    if (Object.keys(fields).length === 0) {
        throw new AppError('no valid fields to update', 400);
    }

    const result = await updateExpenseById(expenseId, fields);

    if (!result) {
        throw new AppError('error updating expense', 500);
    }

    return true;
};


export const del = async (expenseId) => {

    const result = await deleteExpenseById(expenseId);

    if (!result) {
        throw new AppError('error deleting expense', 500);
    }

    return true;
};