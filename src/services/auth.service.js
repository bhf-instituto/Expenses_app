import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, userExistsByEmail } from '../repositories/auth.repository.js';
import { deleteRefreshToken, saveRefreshToken } from '../repositories/refreshToken.repository.js';
import { validateEmail } from '../utils/validations.utils.js';

const saltRounds = Number(process.env.SALT_ROUNDS);

export const register = async (email, password) => {
    const isValidEmail = validateEmail(email);

    if (!isValidEmail) {
        throw { status: 409, message: 'invalid email format or domain' };
    }

    const userExists = await userExistsByEmail(email);

    if (userExists.length > 0) {
        throw { status: 409, message: 'user already exists' };
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = await createUser(email, hashedPassword);


    const accessToken = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET,
        { expiresIn: '15min' }
    );

    const refreshToken = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    )

    await saveRefreshToken(userId, refreshToken);

    return {
        user: { id: userId, email: email },
        accessToken,
        refreshToken
    };
}

export const login = async (email, password) => {
    const normEmail = email.trim().toLowerCase();

    const users = await findUserByEmail(normEmail);
    if (users.length === 0) {
        throw { status: 401, message: 'user does not exist' };
    }

    const user = users[0];

    // console.log(user)
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
        throw { status: 401, message: 'wrong password' };
    }

    const accessToken = jwt.sign(
        { id: user.id, email: normEmail },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: normEmail },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    await saveRefreshToken(user.id, refreshToken);

    
    return {
        user: { id: user.id, email: normEmail },
        accessToken,
        refreshToken
    };
};

export const logout = async (refreshToken) => {

    if (!refreshToken) return;
    
    await deleteRefreshToken(refreshToken);
}
