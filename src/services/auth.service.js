import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from '../repositories/auth.repository.js';
import { deleteRefreshToken, saveRefreshToken } from '../repositories/refreshToken.repository.js';
import { validateEmail } from '../utils/validations.utils.js';

const saltRounds = Number(process.env.SALT_ROUNDS);

export const register = async (email, password) => {
    const normEmail = email.toLowerCase().trim();
    const isValidEmail = validateEmail(normEmail);

    if (!isValidEmail) {
        throw { status: 409, message: 'invalid email format or domain' };
    }

    const existingUser = await findUserByEmail(normEmail);

    if (existingUser.length > 0) {
        throw { status: 409, message: 'user already exists' };
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = await createUser(normEmail, hashedPassword);


    const accessToken = jwt.sign(
        { id_user: userId, email: normEmail },
        process.env.JWT_SECRET,
        { expiresIn: '15min' }
    );

    const refreshToken = jwt.sign(
        { id_user: userId, email: normEmail },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    )

    await saveRefreshToken(userId, refreshToken);

    return {
        user: { id_user: userId, email: normEmail },
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
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
        throw { status: 401, message: 'wrong password' };
    }

    const accessToken = jwt.sign(
        { id_user: user.id_user, email: normEmail },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id_user: user.id_user, email: normEmail },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    await saveRefreshToken(user.id, refreshToken);

    return {
        user: { id_user: user.id_user, email: normEmail },
        accessToken,
        refreshToken
    };
};

export const logout = async (refreshToken) => {

    if (!refreshToken) return;
    
    await deleteRefreshToken(refreshToken);
}
