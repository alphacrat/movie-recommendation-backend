import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { getGenres, searchMoviesByGenre, searchMoviesByPerson, searchMoviesByTitle, storeTopMovies, storeSearchHistory } from './helper/movie.helper.js';

export default class MovieController {
    static searchMovies = async (req, res) => {
        const { query } = req.query;
        const userId = req.user.id;

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

            await storeSearchHistory(query, movies.slice(0, 2), userId);

            const formattedMovies = movies.map((movie) => ({
                id: movie.id,
                title: movie.title,
                releaseDate: movie.release_date,
                overview: movie.overview,
                posterPath: movie.poster_path,
                vote_average: movie.vote_average,
            }));

            res.json(formattedMovies);
        } catch (error) {
            console.error('Error in searchMovies:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    static saveFavoriteMovie = async (req, res) => {
        try {
            const { movieId } = req.query;
            const userId = req.user.id;

            const intMovieId = parseInt(movieId)

            if (!intMovieId) {
                return res.status(400).json({ error: 'Movie ID is required.' });
            }

            const existingFavorite = await prisma.savedMovie.findUnique({
                where: {
                    userId_movieId: {
                        userId,
                        movieId: intMovieId,
                    },
                },
            });

            if (existingFavorite) {
                return res.status(409).json({ error: 'Movie is already saved as a favorite.' });
            }

            const favorite = await prisma.savedMovie.create({
                data: {
                    userId,
                    movieId: intMovieId,
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

    static getSavedMovies = async (req, res) => {
        try {
            const userId = req.user.id;

            const savedMovies = await prisma.savedMovie.findMany({
                where: { userId },
                select: { movieId: true },
            });

            if (!savedMovies.length) {
                return res.status(200).json({ movieIds: [] });
            }

            const movieIds = savedMovies.map((movie) => movie.movieId);

            return res.status(200).json({ movieIds });
        } catch (error) {
            console.error("Error fetching saved movies:", error);
            return res.status(500).json({ error: "Failed to fetch saved movies." });
        }
    };


    static deleteFavoriteMovie = async (req, res) => {
        try {
            const { movieId } = req.query;
            const userId = req.user.id;

            const intMovieId = parseInt(movieId);

            if (!intMovieId) {
                return res.status(400).json({ error: 'Movie ID is required.' });
            }

            const existingFavorite = await prisma.savedMovie.findUnique({
                where: {
                    userId_movieId: {
                        userId,
                        movieId: intMovieId,
                    },
                },
            });

            if (!existingFavorite) {
                return res.status(404).json({ error: 'Movie is not found in favorites.' });
            }

            await prisma.savedMovie.delete({
                where: {
                    userId_movieId: {
                        userId,
                        movieId: intMovieId,
                    },
                },
            });

            return res.status(200).json({ message: 'Movie removed from favorites successfully.' });
        } catch (error) {
            console.error('Error deleting favorite movie:', error);
            return res.status(500).json({ error: 'Failed to delete favorite movie.' });
        }
    };

}
