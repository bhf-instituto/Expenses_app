import { getSetByCategoryId } from '../repositories/set.repository.js'

const attachCategoryContext = async (req, res, next) => {
    try {
        const categoryId = req.params.id_category;        

        const result = await getSetByCategoryId(categoryId);

        console.log(result);

        if (result.length === 0) return res.status(404).json({
            ok: false,
            message: 'Category not found'
        });

        console.log(req.user);


        req.category_id = categoryId;
        req.user.set = { id: result[0].set_id };



        next();
    } catch (error) {
        next();
    }

}

export { attachCategoryContext }