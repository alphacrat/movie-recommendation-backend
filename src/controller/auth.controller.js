// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const COOKIE_OPTIONS = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
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
            const { name, email, password } = req.body;

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
                    password: hashedPassword
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true
                }
            });

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.cookie('access_token', token, COOKIE_OPTIONS);

            res.status(201).json({
                message: 'User registered successfully',
                user
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
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.cookie('access_token', token, COOKIE_OPTIONS);

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                message: 'Login successful',
                user: userWithoutPassword
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
                    savedMovies: {
                        include: {
                            movie: true
                        }
                    }
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
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'strict'
            });

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Server error during logout' });
        }
    }
}
