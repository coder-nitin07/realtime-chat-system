import express from "express";
import authRouter from "./modules/auth/auth.routes.js";
const app = express();

// 
app.use(express.json());

// routes
app.use('/auth', authRouter);

app.get('/', (req, res)=>{
    res.send('Real Time Chat App is running....');
});

export default app;