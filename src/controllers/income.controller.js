import * as incomeService from '../services/income.service.js';

const createIncome = async (req, res) => {
    try {
        const setId = req.set.id;
        const { income_type, amount, income_date } = req.body;

        if (income_type === undefined || amount === undefined || !income_date) {
            return res.status(400).json({
                ok: false,
                data: { message: 'missing required fields' }
            });
        }

        const incomeId = await incomeService.create({
            setId,
            income_type,
            amount,
            income_date
        });

        return res.status(201).json({
            ok: true,
            data: {
                id: incomeId,
                message: 'income created correctly'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const getIncomes = async (req, res) => {
    try {
        const setId = req.set.id;
        const {
            income_type,
            from_date,
            to_date,
            updated_after,
            page,
            limit
        } = req.query;

        const incomes = await incomeService.getAll({
            setId,
            income_type,
            from_date,
            to_date,
            updated_after,
            page,
            limit
        });

        return res.status(200).json({
            ok: true,
            data: incomes
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const getIncomeAnalytics = async (req, res) => {
    try {
        const setId = req.set.id;
        const {
            from_date,
            to_date,
            income_type,
            category_limit,
            category_sort
        } = req.query;

        const analytics = await incomeService.getAnalytics({
            setId,
            from_date,
            to_date,
            income_type,
            category_limit,
            category_sort
        });

        return res.status(200).json({
            ok: true,
            data: analytics
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const updateIncome = async (req, res) => {
    try {
        const setId = req.set.id;
        const incomeId = req.params.id_income;
        const { income_type, amount, income_date } = req.body;

        await incomeService.update({
            setId,
            incomeId,
            income_type,
            amount,
            income_date
        });

        return res.status(200).json({
            ok: true,
            data: { message: 'income updated correctly' }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const deleteIncome = async (req, res) => {
    try {
        const setId = req.set.id;
        const incomeId = req.params.id_income;

        await incomeService.remove({
            setId,
            incomeId
        });

        return res.status(200).json({
            ok: true,
            data: { message: 'income deleted correctly' }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export { createIncome, getIncomes, getIncomeAnalytics, updateIncome, deleteIncome };
