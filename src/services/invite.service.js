import { findUserByEmail, userExistsByEmail } from "../repositories/auth.repository.js";
import { normString, validateEmail } from "../utils/validations.utils.js"
import jwt from "jsonwebtoken";

const create = async (userId, setId, invitedUserEmail) => {

    // const validEmail = validateEmail(invitedUserEmail);

    // if(!validEmail) throw { status: 402, message: 'invalid email' };

    const userExists = await userExistsByEmail(invitedUserEmail);

    if (!userExists) throw { status: 409, message: 'user doesnt exist' };

    const inviteToken = jwt.sign(
        {
            user_id: userId,
            set_id: setId,
            invited_user_email: invitedUserEmail
        },
        process.env.JWT_INVITE_SECRET,
        { expiresIn: '7d' }
    )

    return {
        token : inviteToken
    }
}

const accept = (inviteToken) => {

    const payload = jwt.verify(inviteToken, process.env.JWT_INVITE_SECRET);

    if(!payload) console.log("→→");
      

    // console.log(payload);
    
}

export { create, accept }