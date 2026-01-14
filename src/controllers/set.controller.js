import * as setService from '../services/set.service.js'

const createSet = async (req, res) => {
    try {
        const setName = req.body.set_name;
        const userId = req.user.id;

        if (!setName) return res.status(400).json({
            ok: false,
            message: "missing set_name"
        });

        const result = await setService.create(userId, setName)

        return res.status(201).json({
            ok: true,
            data: {
                message: 'set created correctly',
                set: result.set
            }
        });


    } catch (error) {
        return res.status(500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

const getAllSets = async (req, res) => {
    try {
        const userId = req.user.id;
        const userSets = await setService.getAll(userId);

        if (!userSets) return res.status(400).json({
            ok: false,
            message: "user doesnt belong to any set yet"
        });

        return res.status(201).json({
            ok: true,
            sets: userSets

        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export { createSet, getAllSets }