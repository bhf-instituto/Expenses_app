import { dbStatus } from '../repositories/status.repository.js'

const healthUser = (req, res) => {
    const user = req.user;


    return res.status(200).json({
        ok: true,
        data: {
            message: 'user logged in',
            user
        }
    })
}

const healthDb = async(req, res) => {
    const isDbConnected = await dbStatus();

    if(!isDbConnected) return res.status(400).json({
        ok:false,
        data: { message: 'DB not connected' }
    })

    return res.status(200).json({
        ok: true,
        data: { message: 'DB connected ' }
    })

}

export { healthUser, healthDb }
