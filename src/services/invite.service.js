import { userExistsByEmail } from "../repositories/auth.repository.js";
import { getRole,addSetParticipant } from "../repositories/set.repository.js";
import { validateEmail } from "../utils/validations.utils.js"
import jwt from "jsonwebtoken";

const create = async (setId, invitedUserEmail) => {

    const validEmail = validateEmail(invitedUserEmail);
    // console.log("→→" + validEmail);
    

    if(!validEmail) throw { status: 402, message: 'invalid email' };

    console.log(invitedUserEmail)

    const user = await userExistsByEmail(invitedUserEmail);

    // console.log(user)
    if (!user.exist) throw { status: 409, message: 'user doesnt exist' };

    const inviteToken = jwt.sign(
        {
            type: 'invite',
            set_id: setId,
            invited_id : user.id
        },
        process.env.JWT_INVITE_SECRET,
        { expiresIn: '7d' }
    )

    return inviteToken;
}

const accept = async (userId, inviteToken) => {

    const payload = jwt.verify(inviteToken, process.env.JWT_INVITE_SECRET);

    if (payload.type !== 'invite') throw { status: 409, message: 'invalid token type' };

    if(payload.invited_id !== userId) throw { status: 409, message: 'invitation is not for you' };
    
    const alreadyParticipant = await getRole(payload.set_id, userId);
    
    if(alreadyParticipant == 0 || alreadyParticipant == 1 ) throw { status: 409, message: 'already participant' };

    await addSetParticipant(payload.set_id, userId);
    
    return true;
}

export { create, accept }