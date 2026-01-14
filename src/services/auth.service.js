import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, userExistsByEmail } from '../repositories/auth.repository.js';
import { deleteRefreshTokenByUserId, saveOrUpdateRefreshToken } from '../repositories/refreshToken.repository.js';
import { validateEmail } from '../utils/validations.utils.js';

const saltRounds = Number(process.env.SALT_ROUNDS);

export const register = async (email, password) => {
    const isValidEmail = validateEmail(email);

    if (!isValidEmail) {
        throw { status: 409, message: 'invalid email format or domain' };
    }

    const user = await userExistsByEmail(email);

    if (user.exist) {
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

    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds)
    await saveOrUpdateRefreshToken(userId, hashedRefreshToken);

    return {
        user: { id: userId, email: email },
        accessToken,
        refreshToken
    };
}

export const login = async (email, password) => {
    const normEmail = email.trim().toLowerCase();

    const user = await findUserByEmail(normEmail);

    if (!user.exist) {
        throw { status: 401, message: 'user does not exist' };
    }

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

    const hashedRefreshToken = await bcrypt.hash(refreshToken ,saltRounds);
    
    await saveOrUpdateRefreshToken(user.id, hashedRefreshToken);

    return {
        user: { id: user.id, email: normEmail },
        accessToken,
        refreshToken
    };
};

export const logout = async (userId) => {

    if (!userId) return null;
    
    await deleteRefreshTokenByUserId(userId);

    return true;
}
