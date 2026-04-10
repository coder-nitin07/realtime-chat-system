import express from "express";
import authRouter from "./modules/auth/auth.routes.js";
import cookieParser from 'cookie-parser';
const app = express();

// 
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/auth', authRouter);

app.get('/', (req, res)=>{
    res.send('Real Time Chat App is running....');
});

export default app;