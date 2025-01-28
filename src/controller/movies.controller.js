import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { getGenres, searchMoviesByGenre, searchMoviesByPerson, searchMoviesByTitle, storeTopMovies, storeSearchHistory } from './helper/movie.helper.js';

export default class MovieController {
    static searchMovies = async (req, res) => {
        const { query } = req.query;
        const { userId } = req.body;

        if (!query || !userId) {
            return res.status(400).json({ error: 'Query and userId are required.' });
        }

        try {
            let movies = [];
            const genreMap = await getGenres();

            if (genreMap[query.toLowerCase()]) {
                const genreId = genreMap[query.toLowerCase()];
                movies = await searchMoviesByGenre(genreId);
            } else {
                const personMovies = await searchMoviesByPerson(query);
                if (personMovies.length > 0) {
                    movies = personMovies;
                } else {
                    movies = await searchMoviesByTitle(query);
                }
            }

            await storeTopMovies(movies);

            await storeSearchHistory(query, movies.slice(0, 2), userId);

            const formattedMovies = movies.map((movie) => ({
                id: movie.id,
                title: movie.title,
                popularity: movie.popularity,
                releaseDate: movie.release_date,
                overview: movie.overview,
                posterPath: movie.poster_path,
            }));

            res.json(formattedMovies);
        } catch (error) {
            console.error('Error in searchMovies:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    static recordInteraction = async (req, res) => {
        const { movieId, userId } = req.body;

        if (!movieId || !userId) {
            return res.status(400).json({ error: 'MovieId and userId are required.' });
        }

        try {
            const existingMovie = await prisma.movie.findUnique({
                where: { id: movieId },
            });

            if (!existingMovie) {
                return res.status(404).json({ error: 'Movie not found in the database.' });
            }

            await prisma.movieInteraction.create({
                data: {
                    userId,
                    movieId,
                },
            });

            res.status(201).json({ message: 'Interaction recorded successfully.' });
        } catch (error) {
            console.error('Error in recordInteraction:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    static saveFavoriteMovie = async (req, res) => {
        try {
            const { movieId } = req.body;
            const userId = req.user.id;

            if (!movieId) {
                return res.status(400).json({ error: 'Movie ID is required.' });
            }

            const movie = await prisma.movie.findUnique({
                where: { id: movieId },
            });

            if (!movie) {
                return res.status(404).json({ error: 'Movie does not exist in the database.' });
            }

            const existingFavorite = await prisma.savedMovie.findUnique({
                where: {
                    userId_movieId: {
                        userId,
                        movieId,
                    },
                },
            });

            if (existingFavorite) {
                return res.status(409).json({ error: 'Movie is already saved as a favorite.' });
            }

            const favorite = await prisma.savedMovie.create({
                data: {
                    userId,
                    movieId,
                },
            });

            return res.status(201).json({
                message: 'Movie saved as favorite successfully.',
                data: favorite,
            });
        } catch (error) {
            console.error('Error saving favorite movie:', error);
            return res.status(500).json({ error: 'Failed to save favorite movie.' });
        }
    };

}

