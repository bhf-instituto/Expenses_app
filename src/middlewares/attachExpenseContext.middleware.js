import { getExpenseById, getDeletedExpenseByExpenseId } from '../repositories/expense.repository.js';

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
            if (req.method === 'DELETE') {
                const deletedExpense = await getDeletedExpenseByExpenseId(expenseId);

                if (deletedExpense) {
                    req.set = {
                        id: deletedExpense.set_id
                    };

                    req.expense = {
                        id: expenseId,
                        user_id: null,
                        isOwner: false,
                        alreadyDeleted: true
                    };

                    return next();
                }
            }

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
            user_id: expense.user_id,
            isOwner: expense.user_id === req.user.id,
            alreadyDeleted: false
        };

        next();

    } catch (error) {
        next(error);
    }
};