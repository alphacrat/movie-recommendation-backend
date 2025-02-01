import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Built-in environment detection - no .env required
const IS_PRODUCTION = process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    process.env.VERCEL === 'true' ||
    process.env.RAILWAY === 'true';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: IS_PRODUCTION ? '.onrender.com' : undefined
};

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}

function validatePassword(password) {
    return password.length >= 8;
}

export default class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password, avatar } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }

            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    avatar: avatar || ''
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    createdAt: true
                }
            });

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET || 'fallback-secret-key-for-development',
                { expiresIn: '24h' }
            );

            res.cookie('access_token', token, COOKIE_OPTIONS);

            res.status(201).json({
                message: 'User registered successfully',
                user,
                token
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Server error during registration' });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET || 'fallback-secret-key-for-development',
                { expiresIn: '24h' }
            );

            res.cookie('access_token', token, COOKIE_OPTIONS);

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                message: 'Login successful',
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    avatar: true
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Server error while fetching profile' });
        }
    }

    static async logout(req, res) {
        try {
            res.clearCookie('access_token', {
                ...COOKIE_OPTIONS,
                maxAge: 0
            });

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Server error during logout' });
        }
    }

    static async updateAvatar(req, res) {
        try {
            const { avatar } = req.body;
            const userId = req.user.id;

            if (!avatar) {
                return res.status(400).json({ error: 'Avatar URL is required' });
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { avatar },
                select: { id: true, name: true, email: true, avatar: true }
            });

            res.json({
                message: 'Avatar updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update avatar error:', error);
            res.status(500).json({ error: 'Server error while updating avatar' });
        }
    }
}