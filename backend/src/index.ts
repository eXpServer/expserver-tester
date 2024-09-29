import express from 'express';
import cors from 'cors';
import apiRouter from './api/routes';
import authMiddleware from './middelware/auth';

const app = express();
app.use(cors());


app.use(authMiddleware);
app.use(apiRouter)


app.listen(3000, () => console.log("Server running on port 3000"));