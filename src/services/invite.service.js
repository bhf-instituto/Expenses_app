import { userExistsByEmail } from "../repositories/auth.repository.js";
import { getRole, addSetParticipant } from "../repositories/set.repository.js";
import { validateEmail } from "../utils/validations.utils.js"
import { AppError } from '../errors/appError.js'; 
import jwt from "jsonwebtoken";

const create = async (setId, invitedUserEmail, setRole) => {
    
    const validEmail = validateEmail(invitedUserEmail);

    if (!validEmail) throw new AppError('invalid email', 400);

    const user = await userExistsByEmail(invitedUserEmail);

    if (!user) throw new AppError('user does not exist', 400);

    const inviteToken = jwt.sign(
        {
            type: 'invite',
            set_id: setId,
            invited_id: user.id
        },
        process.env.JWT_INVITE_SECRET,
        { expiresIn: '7d' }
    )

    return inviteToken;
}

const accept = async (userId, inviteToken) => {

    const payload = jwt.verify(inviteToken, process.env.JWT_INVITE_SECRET);

    if (payload.type !== 'invite') throw new AppError('invalid token type', 400);

    if (payload.invited_id !== userId) throw new AppError('invitation is not for you', 400);

    const alreadyParticipant = await getRole(payload.set_id, userId);

    if (alreadyParticipant == 0 || alreadyParticipant == 1) throw new AppError('already participant', 400);

    await addSetParticipant(payload.set_id, userId);

    return payload.set_id;
}

export { create, accept }