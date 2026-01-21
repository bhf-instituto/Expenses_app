import { getExpenseById } from '../repositories/expense.repository.js';
import SET_ROLE from '../constants/setRoles.js'

export const attachExpenseContext = async (req, res, next) => {
    try {
        const expenseId = Number(req.params.id_expense);

        if (!Number.isInteger(expenseId)) {
            return res.status(400).json({
                ok: false,
                data: { message: 'invalid expense id' }
            });
        }

        const expense = await getExpenseById(expenseId);

        if (!expense) {
            return res.status(404).json({
                ok: false,
                data: { message: 'expense not found' }
            });
        }

        // attach set context (inverso)
        req.set = {
            id: expense.set_id
        };

        // attach expense context
        req.expense = {
            id: expense.id,
            user_id: expense.user_id
        };

        next();

    } catch (error) {
        next(error);
    }
};