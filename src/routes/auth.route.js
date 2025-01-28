import express from 'express';
import AuthController from '../controller/auth.controller.js';
import tokenAuth from '../middleware/auth.middleware.js';
import MovieController from '../controller/movies.controller.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('User route');
})

router.post('/auth/register', AuthController.register);

router.post('/auth/login', AuthController.login);

router.get('/auth/me', tokenAuth, AuthController.getProfile);

router.post('/auth/logout', tokenAuth, AuthController.logout);

router.get('/movie/search', MovieController.searchMovies);

router.post('/movie/interaction', MovieController.recordInteraction);

router.post('/movie/favorite', tokenAuth, MovieController.saveFavoriteMovie);



export default router;