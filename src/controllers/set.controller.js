import * as setService from '../services/set.service.js';

const createSet = async (req, res) => {
    try {
        const setName = req.body.set_name;
        const userId = req.user.id;

        if (!setName) return res.status(400).json({
            ok: false,
            data: { message: 'missing set_name' }
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
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const getSet = async (req, res) => {
    try {
        const setId = req.params.id_set;
        const userSet = await setService.getSet(setId);

        return res.status(200).json({
            ok: true,
            data: {
                set: userSet
            }
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const getAllSets = async (req, res) => {
    try {
        const userId = req.user.id;

        const userSets = await setService.getAll(userId);

        return res.status(200).json({
            ok: true,
            data: {
                sets: userSets
            }
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const editSetName = async (req, res) => {
    try {
        const setId = req.params.id_set;
        const setName = req.body.set_name;

        if (!setId || !setName) return res.status(400).json({
            ok: false,
            data: { message: 'all fields required' }
        });

        const result = await setService.edit(setId, setName);

        if (!result) return res.status(404).json({
            ok: false,
            data: { message: 'set not found' }
        });

        return res.status(200).json({
            ok: true,
            data: {
                message: 'set edited correctly'
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const deleteSet = async (req, res) => {
    try {
        const setId = req.params.id_set;

        await setService.del(setId);

        return res.status(200).json({
            ok: true,
            data: {
                message: 'set deleted correctly'
            }
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

export { createSet, getAllSets, editSetName, deleteSet, getSet };
