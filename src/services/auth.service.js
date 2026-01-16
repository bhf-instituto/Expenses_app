import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, userExistsByEmail } from '../repositories/auth.repository.js';
import { deleteRefreshTokenByUserId, saveOrUpdateRefreshToken } from '../repositories/refreshToken.repository.js';
import { validateEmail } from '../utils/validations.utils.js';
import { AppError } from '../errors/appError.js';

const saltRounds = Number(process.env.SALT_ROUNDS);

export const register = async (email, password) => {
    const validEmail = validateEmail(email);

    if (!validEmail) throw new AppError('invalid email format', 400);

    const user = await userExistsByEmail(validEmail);

    if (user) throw new AppError('user already exists', 400);

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = await createUser(validEmail, hashedPassword);


    const accessToken = jwt.sign(
        { id: userId, email: validEmail},
        process.env.JWT_SECRET,
        { expiresIn: '15min' }
    );

    const refreshToken = jwt.sign(
        { id: userId, email: validEmail},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    )

    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds)
    await saveOrUpdateRefreshToken(userId, hashedRefreshToken);

    return {
        user: { id: userId, email: validEmail},
        accessToken,
        refreshToken
    };
}

export const login = async (email, password) => {

    const validEmail = validateEmail(email);

    if(!validEmail) throw new AppError('invalid email format', 404);

    const user = await findUserByEmail(validEmail);

    if(!user) throw new AppError('user doesnt exists', 401);

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) throw new AppError('invalid password', 400);

    const accessToken = jwt.sign(
        { id: user.id, email: validEmail },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: validEmail },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken ,saltRounds);
    
    await saveOrUpdateRefreshToken(user.id, hashedRefreshToken);

    return {
        user: { id: user.id, email: validEmail },
        accessToken,
        refreshToken
    };
};

export const logout = async (userId) => {

    if (!userId) return null;
    
    await deleteRefreshTokenByUserId(userId);

    return true;
}
