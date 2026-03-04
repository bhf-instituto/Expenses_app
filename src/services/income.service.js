import {
    createIncome,
    getIncomesByFilters,
    getIncomeTotalByRange,
    getExpenseTotalByRange,
    getExpenseTotalsByTypeInRange,
    getExpenseTotalsByCategoryInRange
} from '../repositories/income.repository.js';
import { AppError } from '../errors/appError.js';
import INCOME_TYPE from '../constants/incomeTypes.constant.js';
import EXPENSE_TYPE from '../constants/expenseTypes.constant.js';

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getPercent = (value, total) => {
    const normalizedValue = Number(value || 0);
    const normalizedTotal = Number(total || 0);
    if (normalizedTotal <= 0) return 0;
    return round2((normalizedValue / normalizedTotal) * 100);
};

const getExpenseTypeLabel = (expenseType) => {
    const normalized = Number(expenseType);
    switch (normalized) {
        case EXPENSE_TYPE.FIJO:
            return 'FIJO';
        case EXPENSE_TYPE.VARIABLE:
            return 'VARIABLE';
        case EXPENSE_TYPE.PROVEEDORES:
            return 'PROVEEDOR';
        default:
            return 'DESCONOCIDO';
    }
};

export const create = async ({
    setId,
    income_type,
    amount,
    income_date
}) => {
    const normalizedSetId = Number(setId);
    if (!Number.isInteger(normalizedSetId) || normalizedSetId <= 0) {
        throw new AppError('invalid set id', 400);
    }

    const incomeType = Number(income_type);
    if (!Object.values(INCOME_TYPE).includes(incomeType)) {
        throw new AppError('invalid income type', 400);
    }

    const normalizedAmount = Number(amount);
    if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
        throw new AppError('invalid amount', 400);
    }

    if (!income_date || isNaN(Date.parse(income_date))) {
        throw new AppError('invalid income_date', 400);
    }

    const normalizedIncomeDate = String(income_date).slice(0, 10);

    return await createIncome(
        normalizedSetId,
        incomeType,
        normalizedAmount,
        normalizedIncomeDate
    );
};

export const getAll = async ({
    setId,
    income_type,
    from_date,
    to_date,
    updated_after,
    page,
    limit
}) => {
    const normalizedSetId = Number(setId);
    if (!Number.isInteger(normalizedSetId) || normalizedSetId <= 0) {
        throw new AppError('invalid set id', 400);
    }

    const filters = { setId: normalizedSetId };

    if (income_type !== undefined) {
        const incomeType = Number(income_type);
        if (!Object.values(INCOME_TYPE).includes(incomeType)) {
            throw new AppError('invalid income type filter', 400);
        }
        filters.income_type = incomeType;
    }

    if (from_date !== undefined) {
        if (isNaN(Date.parse(from_date))) {
            throw new AppError('invalid from_date format', 400);
        }
        filters.from_date = String(from_date).slice(0, 10);
    }

    if (to_date !== undefined) {
        if (isNaN(Date.parse(to_date))) {
            throw new AppError('invalid to_date format', 400);
        }
        filters.to_date = String(to_date).slice(0, 10);
    }

    if (updated_after !== undefined) {
        if (isNaN(Date.parse(updated_after))) {
            throw new AppError('invalid updated_after format', 400);
        }
        filters.updated_after = updated_after;
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

    return await getIncomesByFilters(filters);
};

export const getAnalytics = async ({
    setId,
    from_date,
    to_date,
    income_type,
    category_limit
}) => {
    const normalizedSetId = Number(setId);
    if (!Number.isInteger(normalizedSetId) || normalizedSetId <= 0) {
        throw new AppError('invalid set id', 400);
    }

    if (!from_date || !to_date) {
        throw new AppError('from_date and to_date are required', 400);
    }

    if (isNaN(Date.parse(from_date))) {
        throw new AppError('invalid from_date format', 400);
    }

    if (isNaN(Date.parse(to_date))) {
        throw new AppError('invalid to_date format', 400);
    }

    const normalizedFromDate = String(from_date).slice(0, 10);
    const normalizedToDate = String(to_date).slice(0, 10);

    if (normalizedFromDate > normalizedToDate) {
        throw new AppError('from_date cannot be greater than to_date', 400);
    }

    let normalizedIncomeType;
    if (income_type !== undefined) {
        normalizedIncomeType = Number(income_type);
        if (!Object.values(INCOME_TYPE).includes(normalizedIncomeType)) {
            throw new AppError('invalid income type filter', 400);
        }
    }

    const normalizedCategoryLimit = category_limit !== undefined ? Number(category_limit) : 5;
    if (
        !Number.isInteger(normalizedCategoryLimit)
        || normalizedCategoryLimit <= 0
        || normalizedCategoryLimit > 50
    ) {
        throw new AppError('invalid category_limit', 400);
    }

    const [incomeTotalRow, expenseTotalRow, byTypeRows, byCategoryRows] = await Promise.all([
        getIncomeTotalByRange(
            normalizedSetId,
            normalizedFromDate,
            normalizedToDate,
            normalizedIncomeType
        ),
        getExpenseTotalByRange(normalizedSetId, normalizedFromDate, normalizedToDate),
        getExpenseTotalsByTypeInRange(normalizedSetId, normalizedFromDate, normalizedToDate),
        getExpenseTotalsByCategoryInRange(
            normalizedSetId,
            normalizedFromDate,
            normalizedToDate,
            normalizedCategoryLimit
        )
    ]);

    const incomeTotal = Number(incomeTotalRow?.total || 0);
    const expenseTotal = Number(expenseTotalRow?.total || 0);
    const remaining = incomeTotal - expenseTotal;

    const by_type = byTypeRows.map((row) => {
        const total = Number(row.total || 0);
        return {
            expense_type: Number(row.expense_type),
            expense_type_label: getExpenseTypeLabel(row.expense_type),
            total,
            percent_of_income: getPercent(total, incomeTotal),
            percent_of_expenses: getPercent(total, expenseTotal)
        };
    });

    const by_category = byCategoryRows.map((row) => {
        const total = Number(row.total || 0);
        return {
            category_id: Number(row.category_id),
            category_name: row.category_name,
            expense_type: Number(row.expense_type),
            expense_type_label: getExpenseTypeLabel(row.expense_type),
            total,
            percent_of_income: getPercent(total, incomeTotal),
            percent_of_expenses: getPercent(total, expenseTotal)
        };
    });

    return {
        range: {
            from_date: normalizedFromDate,
            to_date: normalizedToDate
        },
        income_filter: {
            income_type: normalizedIncomeType ?? null
        },
        totals: {
            income_total: incomeTotal,
            expense_total: expenseTotal,
            remaining_balance: remaining,
            expense_vs_income_percent: getPercent(expenseTotal, incomeTotal)
        },
        by_type,
        by_category
    };
};
