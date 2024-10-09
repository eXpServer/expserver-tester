import express from 'express';
import cors from 'cors';
import apiRouter from './api/stages/routes';
import authRouter from './api/auth/routes';
import authMiddleware from './middelware/auth';
import { errorHandler } from './middelware/error';
import logger from './middelware/logger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Core } from './core/Core';
import path from 'path';

const app = express();
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(logger);
app.use('/token', authRouter);
app.use(authMiddleware);
app.use('/stage', apiRouter)
app.use(errorHandler);


Core.iniitialize(httpServer, io, app);