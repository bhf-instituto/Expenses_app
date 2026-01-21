import * as providerService from '../services/provider.service.js';

const editProvider = async (req, res) => {
    try {
        console.log('→→ aca loco →→');

        const providerId = req.provider_id;
        const setId = req.set.id;
        console.log("→ ", req.set);


        const {
            name,
            contact_name,
            phone
        } = req.body;

        if (!name && !contact_name && !phone) {
            return res.status(400).json({
                ok: false,
                message: 'nothing to update'
            });
        }

        const result = await providerService.edit(
            providerId,
            setId,
            { name, contact_name, phone }
        );

        return res.status(200).json({
            ok: true,
            data: result,
            message: 'provider updated correctly'
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'internal server error'
        });
    }
};

const deleteProvider = async (req, res) => {
    try {
        const providerId = req.provider_id;
        const setId = req.set.id;

        const result = await providerService.del(providerId, setId);

        if (!result) res.status(500).json({
            ok: false,
            message: "error deleting provider"
        })

        return res.status(200).json({
            ok: true,
            category_id: result,
            message: "provider deleted correctly"
        })


    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }

}

const getProviders = async (req, res) => {
    try {

        const setId = req.set.id;

        const result = await providerService.getAll(setId);

        if (!result) return res.status(200).json({
            ok: true,
            data: {
                message: 'theres no providers in this group yet '
            }
        })

        return res.status(200).json({
            ok: true,
            result: result
        })


    } catch (error) {
        console.log(error);

        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }


}
const createProvider = async (req, res) => {
    try {
        const setId = req.set.id;
        const { name, contactName, phone } = req.body;

        if (!name) return res.status(403).json({
            ok: false,
            data: {
                message: 'provider name needed'
            }
        })

        const result = await providerService.create(setId, name, contactName, phone)

        return res.status(201).json({ ok: true });

    } catch (error) {
        return res.status(error.status || 500).json({
            ok: false,
            data: { message: error.message || 'internal service error' }
        });
    }
}

export { createProvider, getProviders, deleteProvider, editProvider } 