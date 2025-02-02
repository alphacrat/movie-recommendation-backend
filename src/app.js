import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/auth.route.js'

const app = express()

app.use(cors(
    {
        origin: ['http://localhost:5173', 'https://movie-recommendation-backend-2opk.onrender.com'],
        credentials: true
    }
))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static("public"))
app.use(cookieParser())
app.use('/api/v1', router)



export default app

