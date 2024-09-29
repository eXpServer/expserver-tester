import express from 'express';
import cors from 'cors';
import apiRouter from './api/stages/routes';
import authRouter from './api/auth/routes';
import authMiddleware from './middelware/auth';
import { errorHandler } from './middelware/error';
import { TESTER_PORT } from './constants';
import logger from './middelware/logger';

const app = express();
app.use(cors());


app.use(logger);
app.use('/token', authRouter);
app.use(authMiddleware);
app.use('/stage', apiRouter)
app.use(errorHandler);


app.listen(TESTER_PORT, () => console.log(`Server running on port ${TESTER_PORT}`));


/**
 * things to ask
 * should i make the user as a separate table 
 * 
 */