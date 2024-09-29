import express from 'express';
import cors from 'cors';
import apiRouter from './api/routes';
import authMiddleware from './middelware/auth';
import { errorHandler } from './middelware/error';
import { TESTER_PORT } from './constants';

const app = express();
app.use(cors());


app.use(authMiddleware);
app.use('/stage', apiRouter)
app.use(errorHandler);


app.listen(TESTER_PORT, () => console.log(`Server running on port ${TESTER_PORT}`));