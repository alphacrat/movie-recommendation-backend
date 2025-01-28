import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TMDBService {
    constructor() {
        this.apiKey = process.env.TMDB_API_KEY;
        this.baseURL = 'https://api.themoviedb.org/3';
    }

    async makeRequest(endpoint, params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                params: {
                    api_key: this.apiKey,
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw new Error('Failed to fetch data from TMDB');
        }
    }

    transformMovieData(tmdbMovie) {
        return {
            title: tmdbMovie.title,
            genre: tmdbMovie.genres.map(g => g.name),
            releaseYear: new Date(tmdbMovie.release_date).getFullYear(),
            rating: tmdbMovie.vote_average,
            popularity: tmdbMovie.popularity,
            keywords: tmdbMovie.keywords?.keywords?.map(k => k.name) || []
        };
    }

    async syncMovieToDatabase(tmdbMovie) {
        const movieData = this.transformMovieData(tmdbMovie);
        return await prisma.movie.upsert({
            where: { id: tmdbMovie.id },
            update: movieData,
            create: {
                id: tmdbMovie.id,
                ...movieData
            }
        });
    }
}

export default new TMDBService();