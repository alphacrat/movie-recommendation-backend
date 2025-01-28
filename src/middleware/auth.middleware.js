import jwt from 'jsonwebtoken';

const tokenAuth = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;

        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

export default tokenAuth;