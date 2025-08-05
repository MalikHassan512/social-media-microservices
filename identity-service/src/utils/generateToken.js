import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

const generateToken = async (user) => {
    try {
        const accessToken = jwt.sign({
            userId: user._id,
            username: user.username,
        }, process.env.JWT_SECRET, { expiresIn: '1d' }); // Generate access token valid for 1 day
        
        const refreshToken = crypto.randomBytes(40).toString('hex'); // Generate a random refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Set expiration to 7 days

        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt,
        });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error('Error generating tokens: ' + error.message);
    }
}

export default generateToken;