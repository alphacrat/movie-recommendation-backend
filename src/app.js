import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/auth.route.js'

const app = express()

app.use(cors(
    {
        // Built-in environment detection - no .env required
        origin: [
            'http://localhost:5173',
            'https://movie-recommendation-backend-2opk.onrender.com',
            'https://moviegenie-client.onrender.com',
            'https://moviegenie-yepb.onrender.com',
            'https://movie-genie-woad.vercel.app'],
        credentials: true
    }
))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static("public"))
app.use(cookieParser())
app.use('/api/v1', router)



export default app

