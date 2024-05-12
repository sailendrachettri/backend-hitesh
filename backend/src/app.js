import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

// allowing cross site origin
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// allowing jsong data format
app.use(express.json({limit: "16kb"}))

// configuring url eg: + or %20 for spaces
app.use(express.urlencoded({extended: true, limit: "16kb"}))

// for images and public files
app.use(express.static("public"))

// for cookies
app.use(cookieParser())

export {app};