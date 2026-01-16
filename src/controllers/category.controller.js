import * as categoryService from '../services/category.service.js';
// import { validateInt } from '../utils/validations.utils.js';

const createCategory = async (req, res) => {

    try {
        // espero categoryName y expenseType desde el body de la req. 
        const setId = req.params.id_set;
        const categoryName = req.body.category_name;
        const expenseType = req.body.expense_type;

        if (!categoryName || !expenseType) return res.status(400).json({
            ok: false,
            data: { message: 'all fields required' }
        });

        const result = await categoryService.create(setId, expenseType, categoryName);

        if (!result) return res.status(404).json({ ok: true, message: "error creating category" })

        return res.status(200).json({
            ok: true,
            category_id: result,
            message: "category created correctly"
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

const deleteCategory = async (res, req) => {
    try {
        const categoryId = req.params.id_category;

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

const getAllCategoriesFromSet = async (req, res) => {
    try {

        const setId = req.params.id_set;
        let expenseType = req.query.expense_type;        

        if (!setId) {
            return res.status(400).json({ ok: false, message: 'all fields needed' })
        }

        // if(expenseType !== undefined) {
        //     expenseType = Number(expenseType);
        // }

        // console.log("→ → ", expenseType);
        

        const result = await categoryService.getAll(setId, expenseType);

        if (result.length === 0) return res.status(200).json({
            ok: true,
            setId: setId,
            message: "theres no categories to show"
        })

        return res.status(201).json({
            ok: true,
            set: setId,
            categories: result
        })

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }

}

const editCategory = async (req, res) => {
    try {
        const categoryId = req.category_id;
        const setId = req.user.set.id;
        const categoryName = req.body.category_name;
        const changeType = Boolean(req.body.change_type);

        if (!categoryId) return res.status(400).json({
            ok: false,
            message: 'category id needed'
        })


        const result = await categoryService.edit(categoryId, categoryName, setId, changeType);

        return res.status(200).json({
            ok: true,
            message: "category edited correctly"
        })

    } catch (error) {
        console.log(error);

        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}


export { createCategory, getAllCategoriesFromSet, editCategory, deleteCategory }