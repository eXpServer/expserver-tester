import cors from 'cors';
import stage1Router from "./routes/stage1";
import stage2Router from './routes/stage2';
import { TESTER_PORT } from "./constants";
import errorHandler from "./middleware/error";
import express from "express";

export const app = express();
app.use(cors());


app.use('/stage1', stage1Router);
app.use('/stage2', stage2Router);
app.use(errorHandler);


app.listen(TESTER_PORT, () => console.log(`Server running on http://localhost:${TESTER_PORT}`));

