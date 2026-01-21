import * as expenseService from '../services/expense.service.js';

const createExpenses = async (req, res) => {
    try {
        const setId = req.set.id;
        const userId = req.user.id;

        const {
            category_id,
            amount,
            description,
            expense_date,
            provider_id
        } = req.body;

        if (!category_id || !amount) {
            return res.status(400).json({
                ok: false,
                data: { message: 'missing required fields' }
            });
        }


        await expenseService.create({
            setId,
            userId,
            category_id,
            amount,
            description,
            expense_date,
            provider_id
        });

        return res.status(201).json({
            ok: true,
            message: 'expense created correctly'
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

const getExpenses = async (req, res) => {
    try {
        const setId = req.set.id;

        const {
            category_id,
            expense_type,
            user_id,
            from_date,
            to_date
        } = req.query;

        const result = await expenseService.getAll({
            setId,
            category_id,
            expense_type,
            user_id,
            from_date,
            to_date
        });

        return res.status(200).json({
            ok: true,
            data: result
        });

    } catch (error) {

        console.log(error);
        
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

const editExpenses = async (req, res) => {

}
export { createExpenses, getExpenses, editExpenses }