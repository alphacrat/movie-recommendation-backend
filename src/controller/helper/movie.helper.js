import axios from 'axios';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const axiosInstance = axios.create({
    baseURL: TMDB_BASE_URL,
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_API_KEY}`,
    },
});

export const getGenres = async () => {
    try {
        const { data } = await axiosInstance.get('/genre/movie/list?language=en-US');
        const genreMap = {};
        data.genres.forEach((genre) => {
            genreMap[genre.name.toLowerCase()] = genre.id;
        });
        return genreMap;
    } catch (error) {
        console.error('Error fetching genres:', error.message);
        throw new Error('Failed to fetch genres.');
    }
};

export const searchMoviesByGenre = async (genreId) => {
    try {
        const { data } = await axiosInstance.get(`/discover/movie?with_genres=${genreId}&language=en-US`);
        return data.results;
    } catch (error) {
        console.error('Error searching movies by genre:', error.message);
        throw new Error('Failed to search movies by genre.');
    }
};

export const searchMoviesByPerson = async (query) => {
    try {
        const { data } = await axiosInstance.get(`/search/person?query=${encodeURIComponent(query)}&language=en-US`);
        if (data.results.length === 0) return [];

        const person = data.results[0];
        const { data: personMovies } = await axiosInstance.get(`/person/${person.id}/movie_credits?language=en-US`);
        return personMovies.cast;
    } catch (error) {
        console.error('Error searching movies by person:', error.message);
        throw new Error('Failed to search movies by person.');
    }
};

export const searchMoviesByTitle = async (query) => {
    try {
        const { data } = await axiosInstance.get(`/search/movie?query=${encodeURIComponent(query)}&language=en-US`);
        return data.results;
    } catch (error) {
        console.error('Error searching movies by title:', error.message);
        throw new Error('Failed to search movies by title.');
    }
};

export const storeTopMovies = async (movies) => {
    try {
        const topMovies = movies.slice(0, 2);

        for (const movie of topMovies) {
            const existingMovie = await prisma.movie.findUnique({
                where: { id: movie.id },
            });

            if (!existingMovie) {
                await prisma.movie.create({
                    data: {
                        id: movie.id,
                        title: movie.title,
                        genre: movie.genre_ids || [],
                        releaseYear: new Date(movie.release_date).getFullYear() || null,
                        rating: movie.vote_average || 0,
                        popularity: movie.popularity || 0,
                        keywords: [],
                    },
                });
            }
        }
    } catch (error) {
        console.error('Error storing top movies:', error.message);
        throw new Error('Failed to store top movies.');
    }
};

export const storeSearchHistory = async (query, movies, userId) => {
    try {
        const historyData = movies.map((movie) => ({
            userId,
            movieId: movie.id,
            searchTerm: query,
        }));

        await prisma.searchHistory.createMany({ data: historyData });
    } catch (error) {
        console.error('Error storing search history:', error.message);
        throw new Error('Failed to store search history.');
    }
};
