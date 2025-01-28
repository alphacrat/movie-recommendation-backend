// routes/user.routes.js
import express from 'express';
import AuthController from '../controller/auth.controller.js';
import tokenAuth from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('User route');
})

router.post('/register', AuthController.register);

router.post('/login', AuthController.login);

router.get('/me', tokenAuth, AuthController.getProfile);

router.post('/logout', tokenAuth, AuthController.logout);

export default router;