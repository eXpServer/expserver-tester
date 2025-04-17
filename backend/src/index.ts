import express from 'express';
import cors from 'cors';
import apiRouter from './api/stages/routes';
import authRouter from './api/auth/routes';
import authMiddleware from './middleware/auth';
import { errorHandler } from './middleware/error';
import logger from './middleware/logger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Core } from './core/Core';
import path from 'path';
import { sequelize } from './models';

const app = express();
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

sequelize.authenticate()
    .then(() => {
        console.log("Databse connected!");
        return sequelize.sync({ alter: process.env.DBEUG == 'true' || false });
    })
    .catch((err) => {
        console.log("Unable to connect to db", err);
    })
app.use(cors());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(logger);
app.use('/token', authRouter);
app.use(authMiddleware);
app.use('/stage', apiRouter)
app.use(errorHandler);




Core.iniitialize(httpServer, io, app);