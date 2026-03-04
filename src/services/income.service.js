import {
    createIncome,
    getIncomeById,
    updateIncomeById,
    deleteIncomeById,
    getIncomesByFilters,
    getIncomeTotalByRange,
    getExpenseTotalByRange,
    getMonthlyIncomeTotals,
    getMonthlyExpenseTotals,
    getExpenseTotalsByTypeInRange,
    getMonthlyExpenseTotalsByType,
    getExpenseCategoryTotalsByRange
} from '../repositories/income.repository.js';
import { AppError } from '../errors/appError.js';
import INCOME_TYPE from '../constants/incomeTypes.constant.js';
import EXPENSE_TYPE from '../constants/expenseTypes.constant.js';

const CATEGORY_SORT = Object.freeze({
    TOTAL: 'total',
    GROWTH: 'growth'
});

const round6 = (value) => Math.round((Number(value) + Number.EPSILON) * 1000000) / 1000000;
const pad2 = (value) => String(value).padStart(2, '0');

const parseYmdAsUtcDate = (value) => {
    const normalized = String(value || '').slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!year || !month || !day) return null;

    return new Date(Date.UTC(year, month - 1, day));
};

const formatUtcYmd = (date) =>
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;

const toMonthKey = (year, month) => `${Number(year)}-${pad2(month)}`;

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

const safeRatio = (numerator, denominator) => {
    const num = Number(numerator || 0);
    const den = Number(denominator || 0);
    if (den <= 0) return null;
    return round6(num / den);
};

const safeGrowth = (currentValue, previousValue) => {
    const current = Number(currentValue || 0);
    const previous = Number(previousValue);
    if (!Number.isFinite(previous) || previous === 0) return null;
    return round6((current - previous) / previous);
};

const getPeriodDays = (fromDate, toDate) => {
    const from = parseYmdAsUtcDate(fromDate);
    const to = parseYmdAsUtcDate(toDate);
    if (!from || !to) return 0;
    return Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
};

const shiftYmdByDays = (dateText, daysDelta) => {
    const date = parseYmdAsUtcDate(dateText);
    if (!date) return null;
    date.setUTCDate(date.getUTCDate() + Number(daysDelta || 0));
    return formatUtcYmd(date);
};

const getPreviousRange = (fromDate, toDate) => {
    const periodDays = getPeriodDays(fromDate, toDate);
    if (!Number.isInteger(periodDays) || periodDays <= 0) return null;

    const previousToDate = shiftYmdByDays(fromDate, -1);
    if (!previousToDate) return null;
    const previousFromDate = shiftYmdByDays(previousToDate, -(periodDays - 1));
    if (!previousFromDate) return null;

    return {
        from_date: previousFromDate,
        to_date: previousToDate
    };
};

const buildMonthBuckets = (fromDate, toDate) => {
    const from = parseYmdAsUtcDate(fromDate);
    const to = parseYmdAsUtcDate(toDate);
    if (!from || !to) return [];

    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
    const months = [];

    while (cursor.getTime() <= end.getTime()) {
        const year = cursor.getUTCFullYear();
        const month = cursor.getUTCMonth() + 1;
        months.push({
            year,
            month,
            key: toMonthKey(year, month)
        });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return months;
};

const computeRollingAverage = (values) => {
    if (!Array.isArray(values) || values.length === 0) return null;
    const sum = values.reduce((acc, current) => acc + Number(current || 0), 0);
    return round6(sum / values.length);
};

const computeExpenseGrowthByWindow = (monthlyRows, key, windowSize) => {
    if (!Array.isArray(monthlyRows) || monthlyRows.length < windowSize * 2) return null;

    const actualRows = monthlyRows.slice(-windowSize);
    const previousRows = monthlyRows.slice(-(windowSize * 2), -windowSize);
    const actualTotal = actualRows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
    const previousTotal = previousRows.reduce((sum, row) => sum + Number(row[key] || 0), 0);

    return safeGrowth(actualTotal, previousTotal);
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

export const update = async ({
    setId,
    incomeId,
    income_type,
    amount,
    income_date
}) => {
    const normalizedSetId = Number(setId);
    if (!Number.isInteger(normalizedSetId) || normalizedSetId <= 0) {
        throw new AppError('invalid set id', 400);
    }

    const normalizedIncomeId = Number(incomeId);
    if (!Number.isInteger(normalizedIncomeId) || normalizedIncomeId <= 0) {
        throw new AppError('invalid income id', 400);
    }

    const current = await getIncomeById(normalizedIncomeId);
    if (!current || Number(current.set_id) !== normalizedSetId) {
        throw new AppError('income not found', 404);
    }

    const patchFields = {};

    if (income_type !== undefined) {
        const normalizedIncomeType = Number(income_type);
        if (!Object.values(INCOME_TYPE).includes(normalizedIncomeType)) {
            throw new AppError('invalid income type', 400);
        }
        patchFields.income_type = normalizedIncomeType;
    }

    if (amount !== undefined) {
        const normalizedAmount = Number(amount);
        if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
            throw new AppError('invalid amount', 400);
        }
        patchFields.amount = normalizedAmount;
    }

    if (income_date !== undefined) {
        if (!income_date || isNaN(Date.parse(income_date))) {
            throw new AppError('invalid income_date', 400);
        }
        patchFields.income_date = String(income_date).slice(0, 10);
    }

    if (Object.keys(patchFields).length === 0) {
        throw new AppError('nothing to update', 400);
    }

    await updateIncomeById(normalizedIncomeId, patchFields);
};

export const remove = async ({ setId, incomeId }) => {
    const normalizedSetId = Number(setId);
    if (!Number.isInteger(normalizedSetId) || normalizedSetId <= 0) {
        throw new AppError('invalid set id', 400);
    }

    const normalizedIncomeId = Number(incomeId);
    if (!Number.isInteger(normalizedIncomeId) || normalizedIncomeId <= 0) {
        throw new AppError('invalid income id', 400);
    }

    const current = await getIncomeById(normalizedIncomeId);
    if (!current || Number(current.set_id) !== normalizedSetId) {
        throw new AppError('income not found', 404);
    }

    await deleteIncomeById(normalizedIncomeId);
};

export const getAnalytics = async ({
    setId,
    from_date,
    to_date,
    income_type,
    category_limit,
    category_sort
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
    if (income_type !== undefined && income_type !== '') {
        normalizedIncomeType = Number(income_type);
        if (!Object.values(INCOME_TYPE).includes(normalizedIncomeType)) {
            throw new AppError('invalid income type filter', 400);
        }
    }

    const normalizedCategoryLimit = category_limit !== undefined ? Number(category_limit) : 5;
    if (
        !Number.isInteger(normalizedCategoryLimit)
        || normalizedCategoryLimit <= 0
        || normalizedCategoryLimit > 100
    ) {
        throw new AppError('invalid category_limit', 400);
    }

    const normalizedCategorySort = String(category_sort || CATEGORY_SORT.TOTAL).trim().toLowerCase();
    if (!Object.values(CATEGORY_SORT).includes(normalizedCategorySort)) {
        throw new AppError('invalid category_sort', 400);
    }

    const previousRange = getPreviousRange(normalizedFromDate, normalizedToDate);
    if (!previousRange) {
        throw new AppError('invalid period range', 400);
    }

    const [
        incomeTotalRow,
        expenseTotalRow,
        monthlyIncomeRows,
        monthlyExpenseRows,
        monthlyExpenseTypeRows,
        expenseByTypeRows,
        categoryCurrentRows,
        categoryPreviousRows
    ] = await Promise.all([
        getIncomeTotalByRange(
            normalizedSetId,
            normalizedFromDate,
            normalizedToDate,
            normalizedIncomeType
        ),
        getExpenseTotalByRange(normalizedSetId, normalizedFromDate, normalizedToDate),
        getMonthlyIncomeTotals(
            normalizedSetId,
            normalizedFromDate,
            normalizedToDate,
            normalizedIncomeType
        ),
        getMonthlyExpenseTotals(normalizedSetId, normalizedFromDate, normalizedToDate),
        getMonthlyExpenseTotalsByType(normalizedSetId, normalizedFromDate, normalizedToDate),
        getExpenseTotalsByTypeInRange(normalizedSetId, normalizedFromDate, normalizedToDate),
        getExpenseCategoryTotalsByRange(normalizedSetId, normalizedFromDate, normalizedToDate),
        getExpenseCategoryTotalsByRange(
            normalizedSetId,
            previousRange.from_date,
            previousRange.to_date
        )
    ]);

    const totalIncome = Number(incomeTotalRow?.total || 0);
    const totalExpense = Number(expenseTotalRow?.total || 0);
    const balance = totalIncome - totalExpense;
    const operatingMargin = safeRatio(balance, totalIncome);

    const months = buildMonthBuckets(normalizedFromDate, normalizedToDate);
    const incomeByMonth = new Map(
        monthlyIncomeRows.map((row) => [toMonthKey(row.year, row.month), Number(row.total || 0)])
    );
    const expenseByMonth = new Map(
        monthlyExpenseRows.map((row) => [toMonthKey(row.year, row.month), Number(row.total || 0)])
    );

    const typeByMonth = new Map();
    monthlyExpenseTypeRows.forEach((row) => {
        const monthKey = toMonthKey(row.year, row.month);
        const current = typeByMonth.get(monthKey) || {
            fixed_total: 0,
            variable_total: 0,
            providers_total: 0
        };
        const amount = Number(row.total || 0);

        if (Number(row.expense_type) === EXPENSE_TYPE.FIJO) {
            current.fixed_total += amount;
        } else if (Number(row.expense_type) === EXPENSE_TYPE.VARIABLE) {
            current.variable_total += amount;
        } else if (Number(row.expense_type) === EXPENSE_TYPE.PROVEEDORES) {
            current.providers_total += amount;
        }

        typeByMonth.set(monthKey, current);
    });

    const monthlyBase = months.map((monthRef) => {
        const monthKey = monthRef.key;
        const income = Number(incomeByMonth.get(monthKey) || 0);
        const expense = Number(expenseByMonth.get(monthKey) || 0);
        const monthlyBalance = income - expense;
        const monthType = typeByMonth.get(monthKey) || {
            fixed_total: 0,
            variable_total: 0,
            providers_total: 0
        };

        return {
            year: monthRef.year,
            month: monthRef.month,
            key: monthKey,
            income,
            expense,
            balance: monthlyBalance,
            execution_ratio: safeRatio(expense, income),
            margin: safeRatio(monthlyBalance, income),
            fixed_total: Number(monthType.fixed_total || 0),
            variable_total: Number(monthType.variable_total || 0),
            providers_total: Number(monthType.providers_total || 0)
        };
    });

    const monthlyTrend = monthlyBase.map((row, index) => {
        const previous = index > 0 ? monthlyBase[index - 1] : null;
        const recentMargins = index >= 2
            ? [monthlyBase[index - 2].margin, monthlyBase[index - 1].margin, row.margin]
            : [];
        const rollingMargin = recentMargins.length === 3 && recentMargins.every((value) => value !== null)
            ? computeRollingAverage(recentMargins)
            : null;

        return {
            year: row.year,
            month: row.month,
            income: row.income,
            expense: row.expense,
            balance: row.balance,
            execution_ratio: row.execution_ratio,
            margin: row.margin,
            rolling_margin_3m: rollingMargin,
            growth_income: previous ? safeGrowth(row.income, previous.income) : null,
            growth_expense: previous ? safeGrowth(row.expense, previous.expense) : null,
            growth_balance: previous ? safeGrowth(row.balance, previous.balance) : null
        };
    });

    const typeTrend = monthlyBase.map((row) => ({
        year: row.year,
        month: row.month,
        fixed_total: row.fixed_total,
        variable_total: row.variable_total,
        providers_total: row.providers_total
    }));

    const expenseTotalsByType = {
        [EXPENSE_TYPE.FIJO]: 0,
        [EXPENSE_TYPE.VARIABLE]: 0,
        [EXPENSE_TYPE.PROVEEDORES]: 0
    };
    expenseByTypeRows.forEach((row) => {
        const expenseType = Number(row.expense_type);
        const total = Number(row.total || 0);
        if (expenseTotalsByType[expenseType] !== undefined) {
            expenseTotalsByType[expenseType] = total;
        }
    });

    const fixedTotal = Number(expenseTotalsByType[EXPENSE_TYPE.FIJO] || 0);
    const variableTotal = Number(expenseTotalsByType[EXPENSE_TYPE.VARIABLE] || 0);
    const providersTotal = Number(expenseTotalsByType[EXPENSE_TYPE.PROVEEDORES] || 0);

    const structure = {
        fixed_ratio: safeRatio(fixedTotal, totalExpense),
        variable_ratio: safeRatio(variableTotal, totalExpense),
        providers_ratio: safeRatio(providersTotal, totalExpense)
    };

    const previousCategoryTotalsById = new Map(
        categoryPreviousRows.map((row) => [Number(row.category_id), Number(row.total || 0)])
    );

    const categoryRankingRaw = categoryCurrentRows.map((row) => {
        const categoryId = Number(row.category_id);
        const totalCurrent = Number(row.total || 0);
        const totalPrevious = Number(previousCategoryTotalsById.get(categoryId) || 0);
        const growthRate = safeGrowth(totalCurrent, totalPrevious);

        return {
            category_id: categoryId,
            name: row.category_name,
            expense_type: Number(row.expense_type),
            expense_type_label: getExpenseTypeLabel(row.expense_type),
            total_current: totalCurrent,
            total_previous: totalPrevious,
            growth_rate: growthRate,
            is_new_active: totalPrevious === 0 && totalCurrent > 0
        };
    });

    const categoryRankingSorted = [...categoryRankingRaw].sort((a, b) => {
        if (normalizedCategorySort === CATEGORY_SORT.GROWTH) {
            const aHasGrowth = a.growth_rate !== null;
            const bHasGrowth = b.growth_rate !== null;

            if (aHasGrowth && bHasGrowth && b.growth_rate !== a.growth_rate) {
                return b.growth_rate - a.growth_rate;
            }
            if (aHasGrowth !== bHasGrowth) {
                return aHasGrowth ? -1 : 1;
            }
        }

        if (b.total_current !== a.total_current) {
            return b.total_current - a.total_current;
        }

        const aGrowthValue = a.growth_rate ?? Number.NEGATIVE_INFINITY;
        const bGrowthValue = b.growth_rate ?? Number.NEGATIVE_INFINITY;
        return bGrowthValue - aGrowthValue;
    });

    const categoryRanking = categoryRankingSorted.slice(0, normalizedCategoryLimit);

    const marginSeries = monthlyTrend
        .map((row) => row.margin)
        .filter((value) => value !== null);
    const rollingMarginSummary = marginSeries.length >= 3
        ? computeRollingAverage(marginSeries.slice(-3))
        : null;
    const previousRollingMarginSummary = marginSeries.length >= 6
        ? computeRollingAverage(marginSeries.slice(-6, -3))
        : null;
    const marginTrend3m = safeGrowth(rollingMarginSummary, previousRollingMarginSummary);

    const summary = {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance,
        operating_margin: operatingMargin,
        expense_growth_3m: computeExpenseGrowthByWindow(monthlyBase, 'expense', 3),
        expense_growth_6m: computeExpenseGrowthByWindow(monthlyBase, 'expense', 6),
        expense_growth_12m: computeExpenseGrowthByWindow(monthlyBase, 'expense', 12),
        margin_rolling_3m: rollingMarginSummary,
        margin_trend_3m: marginTrend3m,
        expense_growth_by_type: {
            fixed_3m: computeExpenseGrowthByWindow(monthlyBase, 'fixed_total', 3),
            fixed_6m: computeExpenseGrowthByWindow(monthlyBase, 'fixed_total', 6),
            fixed_12m: computeExpenseGrowthByWindow(monthlyBase, 'fixed_total', 12),
            variable_3m: computeExpenseGrowthByWindow(monthlyBase, 'variable_total', 3),
            variable_6m: computeExpenseGrowthByWindow(monthlyBase, 'variable_total', 6),
            variable_12m: computeExpenseGrowthByWindow(monthlyBase, 'variable_total', 12),
            providers_3m: computeExpenseGrowthByWindow(monthlyBase, 'providers_total', 3),
            providers_6m: computeExpenseGrowthByWindow(monthlyBase, 'providers_total', 6),
            providers_12m: computeExpenseGrowthByWindow(monthlyBase, 'providers_total', 12)
        }
    };

    return {
        scope: {
            set_id: normalizedSetId,
            from_date: normalizedFromDate,
            to_date: normalizedToDate
        },
        previous_scope: previousRange,
        income_filter: {
            income_type: normalizedIncomeType ?? null
        },
        ranking: {
            sort_by: normalizedCategorySort,
            limit: normalizedCategoryLimit
        },
        summary,
        monthly_trend: monthlyTrend,
        structure,
        type_trend: typeTrend,
        category_ranking: categoryRanking
    };
};
