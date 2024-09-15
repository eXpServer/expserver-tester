import express from "express";
import cors from 'cors';
const PORT = 6969;

const app = express();
app.use(cors());

app.get("/stage1", (_, res) => {
    return res.json({
        hello: "world",
    })
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));