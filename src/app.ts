import express from 'express';
import router from './routes';
import { Request, Response, NextFunction } from 'express';
import HTTPError from './utils/HTTPError';
import cors from 'cors';
import friendsRouter from './routes/friends/router';

import dotenv from 'dotenv';
dotenv.config();

const app = express();

// for development
const corsOptions = {
    origin: 'http://localhost:8081',
    credentials: true
}

app.use(cors(corsOptions));

app.use('/api', router);
app.use('/images', express.static(process.env.IMAGE_FOLDER_PATH!));

app.use('/api/friends', friendsRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HTTPError) {
        res.status(err.statusCode).json({message: err.message});
    }
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"})
    }
})

export default app;