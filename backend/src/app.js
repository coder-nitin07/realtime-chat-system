import express from "express";
import authRouter from "./modules/auth/auth.routes.js";
import cookieParser from 'cookie-parser';
import userRouter from "./modules/users/user.routes.js";
import chatRouter from "./modules/chat/chat.routes.js";
import cors from "cors";
const app = express();

// cors
app.use(cors({
  origin: "*", // your frontend URL
  methods: ["GET", "POST"],
  credentials: true
}));

// 
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/chat', chatRouter);

app.get('/', (req, res)=>{
    res.send('Real Time Chat App is running....');
});

export default app;