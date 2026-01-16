import { getSetByCategoryId } from '../repositories/set.repository.js'

const attachCategoryContext = async (req, res, next) => {
    try {
        const categoryId = req.params.id_category;

        const result = await getSetByCategoryId(categoryId);

        if (result.length === 0) return res.status(404).json({
            ok: false,
            message: 'Category not found'
        });


        req.category_id = categoryId;
        req.set = { id: result[0].set_id };

        next();
    } catch (error) {
        next();
    }

}

export { attachCategoryContext }