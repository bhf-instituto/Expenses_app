import { findUserByEmail, userExistsByEmail } from "../repositories/auth.repository.js";
import { getRole } from "../repositories/set.repository.js";
import { normString, validateEmail } from "../utils/validations.utils.js"
import jwt from "jsonwebtoken";

const create = async (userId, setId, invitedUserEmail) => {

    // const validEmail = validateEmail(invitedUserEmail);

    // if(!validEmail) throw { status: 402, message: 'invalid email' };

    const userExists = await userExistsByEmail(invitedUserEmail);

    if (!userExists) throw { status: 409, message: 'user doesnt exist' };

    const inviteToken = jwt.sign(
        {
            type: 'invite',
            user_id: userId,
            set_id: setId,
            invited_user_email: invitedUserEmail
        },
        process.env.JWT_INVITE_SECRET,
        { expiresIn: '7d' }
    )

    return inviteToken;
}

const accept = (inviteToken) => {
    const payload = jwt.verify(inviteToken, process.env.JWT_INVITE_SECRET);

    if (payload.type !== 'invite') throw { status: 409, message: 'invalid token type' };

    const isSetParticipant = await getRole();

    // console.log(payload);

}

export { create, accept }