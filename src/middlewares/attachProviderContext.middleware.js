import { getSetByProviderId } from '../repositories/provider.repository.js'
import { getRole } from '../repositories/set.repository.js';

const attachProviderContext = async (req, res, next) => {
    try {
        const providerId = req.params.id_provider;  
            
        const result = await getSetByProviderId(providerId);

        if (result.length === 0) return res.status(404).json({
            ok: false,
            message: 'provider doesnt exist'
        });

        req.provider_id = providerId;
        req.set = { id: result[0].set_id };

        next();
    } catch (error) {
        next();
    }
}

export { attachProviderContext }