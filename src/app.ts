import express from 'express';
import router from './routes';
import { Request, Response, NextFunction } from 'express';

const app = express();

app.use('/api', router);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        res.status(500).json({message: err.toString()})
    }
})

export default app;