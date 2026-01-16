import * as setService from '../services/set.service.js';

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
        return res.status(error.status).json({
            ok: false,
            message: error.message || 'internal service error'
        });
    }
}
const getSet = async (req, res) => {
    try {
        const setId = req.params.id_set;
        const userSet = await setService.getSet(setId);

        // if(!userSet) return res.status(403).json({
        //     ok: false,
        //     message: ''
        // })

        return res.status(201).json({
            ok: true,
            sets: userSet

        });

    } catch (error) {
        return res.status(error.status).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};
const getAllSets = async (req, res) => {
    try {
        const userId = req.user.id;

        const userSets = await setService.getAll(userId);


        return res.status(201).json({
            ok: true,
            sets: userSets

        });

    } catch (error) {
        console.log(error);

        return res.status(error.status).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
};

const editSetName = async (req, res) => {
    try {
        const userId = req.user.id;
        const setId = req.params.id_set;
        const setName = req.body.set_name;

        if (!userId || !setId || !setName) return res.status(400).json({
            ok: false,
            message: "all fields required"
        })
        
        const result = await setService.edit(setId, setName);

        if (!result) res.status(400).json({
            ok: false,
            message: "editing set failed"
        })
        return res.status(200).json({
            ok: true,
            message: "set edited correctly"
        })
    } catch (error) {
        return res.status(error.status).json({
            message: error.message
        })
    }
}

const deleteSet = async (req, res) => {

    try {

        const setId = req.params.id_set;

        await setService.del(setId);

        return res.status(200).json({
            ok: true,
            message: "set deleted correctly"
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }

}
export { createSet, getAllSets, editSetName, deleteSet, getSet }