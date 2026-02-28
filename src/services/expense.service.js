import { findCategoryByIdAndSet } from '../repositories/category.repository.js';
import { getTotalsByCategory, getTotalsByProvider, getTotalsByType, getExpensesTotalsByFilters } from '../repositories/totalExpenses.repository.js';
import { createExpense, getExpensesByFilters, getDeletedExpensesByFilters, updateExpenseById, deleteExpenseById } from '../repositories/expense.repository.js';
import EXPENSE_TYPE from '../constants/expenseTypes.constant.js';
import PAYMENT_METHOD from '../constants/paymentMethods.constant.js';
import { AppError } from '../errors/appError.js';
// import { getExpenseTotalsByFilter } from '../controllers/expenses.controller.js';

export const create = async ({
    setId,
    userId,
    category_id,
    amount,
    payment_method,
    description = null,
    expense_date = null
}) => {

    let validExpenseDate = expense_date;
    if (!validExpenseDate) {
        validExpenseDate = new Date().toISOString().split('T')[0];
    }

    const normAmount = Number(amount);
    if (!Number.isInteger(normAmount) || normAmount <= 0) {
        throw new AppError('invalid amount', 400);
    }

    const paymentMethod = Number(payment_method);
    if (!Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
        throw new AppError('invalid payment method', 400);
    }

    const category = await findCategoryByIdAndSet(category_id, setId);
    if (!category) {
        throw new AppError('invalid category for this group', 400);
    }

    const expenseType = Number(category.expense_type);

    const expenseId = await createExpense(
        setId,
        userId,
        category_id,
        expenseType,
        paymentMethod,
        normAmount,
        description,
        validExpenseDate
    );

    return expenseId;
}

export const getAll = async ({
    setId,
    category_id,
    expense_type,
    payment_method,
    user_id,
    from_date,
    to_date,
    updated_after,
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

    if (payment_method !== undefined) {
        const method = Number(payment_method);
        if (!Object.values(PAYMENT_METHOD).includes(method)) {
            throw new AppError('invalid payment method filter', 400);
        }
        filters.payment_method = method;
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

    if (updated_after !== undefined) {
        if (isNaN(Date.parse(updated_after))) {
            throw new AppError('invalid updated_after format', 400);
        }
        filters.updated_after = updated_after;
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


export const getDeleted = async ({ setId, deleted_after, page, limit }) => {

    const filters = { setId };

    if (deleted_after !== undefined) {
        if (isNaN(Date.parse(deleted_after))) {
            throw new AppError('invalid deleted_after format', 400);
        }
        filters.deleted_after = deleted_after;
    }

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

    return await getDeletedExpensesByFilters(filters);
};

export const getTotalsByFilter = async ({
    setId,
    category_id,
    expense_type,
    payment_method,
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

    if (payment_method !== undefined) {
        const method = Number(payment_method);
        if (!Object.values(PAYMENT_METHOD).includes(method)) {
            throw new AppError('invalid payment method filter', 400);
        }
        filters.payment_method = method;
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

    if (data.payment_method !== undefined) {
        const paymentMethod = Number(data.payment_method);
        if (!Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
            throw new AppError('invalid payment method', 400);
        }
        fields.payment_method = paymentMethod;
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


export const del = async (expenseId, setId) => {

    const result = await deleteExpenseById(expenseId, setId);

    if (!result) {
        throw new AppError('error deleting expense', 500);
    }

    return true;
};
