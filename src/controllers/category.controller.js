import * as categoryService from '../services/category.service.js';

const createCategory = async (req, res) => {
    try {
        const setId = req.params.id_set;
        const categoryName = req.body.category_name;
        const expenseType = req.body.expense_type;

        if (!categoryName || expenseType === undefined) {
            return res.status(400).json({
                ok: false,
                data: { message: 'all fields required' }
            });
        }

        const categoryId = await categoryService.create(setId, expenseType, categoryName);

        return res.status(201).json({
            ok: true,
            data: {
                category_id: categoryId,
                message: 'category created correctly'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.category_id;
        const setId = req.set.id;

        await categoryService.del(categoryId, setId);

        return res.status(200).json({
            ok: true,
            data: {
                category_id: Number(categoryId),
                message: 'category deleted correctly'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const getAllCategoriesFromSet = async (req, res) => {
    try {
        const setId = req.params.id_set;
        const expenseType = req.query.expense_type;

        if (!setId) {
            return res.status(400).json({
                ok: false,
                data: { message: 'set id is required' }
            });
        }

        const categories = await categoryService.getAll(setId, expenseType);

        return res.status(200).json({
            ok: true,
            data: {
                set_id: Number(setId),
                categories
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const editCategory = async (req, res) => {
    try {
        const categoryId = req.category_id;
        const categoryName = req.body.category_name;
        const expenseType = req.body.expense_type;

        if (!categoryId) {
            return res.status(400).json({
                ok: false,
                data: { message: 'category id needed' }
            });
        }

        await categoryService.edit(categoryId, categoryName, expenseType);

        return res.status(200).json({
            ok: true,
            data: {
                message: 'category edited correctly'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export { createCategory, getAllCategoriesFromSet, editCategory, deleteCategory };
