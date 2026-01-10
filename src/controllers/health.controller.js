import checkDbStatus from '../repositories/status.repository.js'

const healthUser = (req, res) => {

    if(!req.user) return res.status(400).json({
        ok:false,
        message: 'no user logged in'
    })
    const user = req.user;

    return res.status(200).json({
        ok: true,
        message: 'user logged in',
        data: {
            user
        }
    })
}

const healthDb = async(req, res) => {
    const isDbConnected = await checkDbStatus;

    if(!isDbConnected) return res.status(400).json({
        ok:false,
        message: 'DB not connected'
    })

    return res.status(200).json({
        ok: true,
        message: 'DB connected '
    })

}

export { healthUser, healthDb }