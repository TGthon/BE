import express from 'express';
import router from './routes';
import { Request, Response, NextFunction } from 'express';
import HTTPError from './utils/HTTPError';

const app = express();

app.use('/api', router);

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