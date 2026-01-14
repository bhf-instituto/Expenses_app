import * as categoryService from '../services/category.service.js';
import { validateInt } from '../utils/validations.utils.js';

const createCategory = async (req, res) => {

    try {
        // espero categoryName y categoryType desde el body de la req. 
        const setId = Number(req.params.id_set);
        const role = Number(req.user.set.role);
        const categoryName = req.body.category_name;
        const categoryType = req.body.category_type;

        if (!categoryName) return res.status(400).json({
            ok: false,
            data: { message: 'all fields required' }
        });

        if (!Number.isInteger(categoryType) ||
            (categoryType !== 0 && categoryType !== 1)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid category type'
            })
        }
        if (!setId || Number.isNaN(setId)) {
            return res.status(400).json({ ok: false, message: 'Invalid set id' });
        }

        if (role !== 1) return res.status(403).json({
            ok: false,
            data: { message: 'You cannot create categories in thios group' }
        });

        const result = await categoryService.create(setId, categoryType, categoryName);

        if (!result) return res.status(400).json({
            ok: false,
            data: { message: 'error creating a category' }
        });

        return res.status(200).json({ ok: true, message: "category created correctly" })
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

const getAllCategoriesFromSet = async (req, res) => {
    try {
       
        const setId = validateInt(req.params.id_set);
        
        if (!setId) {
            return res.status(401).json({ ok: false, message: 'invalid fields' })
        }

        const result = await categoryService.getAll(setId);

        // console.log("result: " + JSON.stringify(result));
        
        return res.status(201).json({
            ok: true,
            users: result
        })

    } catch (error) {
        // console.log(error);
        
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }

}


export { createCategory, getAllCategoriesFromSet }