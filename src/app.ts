import express from 'express';
import router from './routes';
import { Request, Response, NextFunction } from 'express';
import HTTPError from './utils/HTTPError';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

import friendsRouter from './routes/friends/router';

const app = express();
app.use('/api', router);
app.use('/api/friends', friendsRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// for development
const corsOptions = {
    origin: ['http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:19006'],
    credentials: true
}

app.use(cors(corsOptions));


//app.use('/images', express.static(process.env.IMAGE_FOLDER_PATH!));

if (process.env.IMAGE_FOLDER_PATH) {
  app.use('/images', express.static(process.env.IMAGE_FOLDER_PATH));
}


/*
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
*/

// Error handlers
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HTTPError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  next(err);
});
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});


export default app;