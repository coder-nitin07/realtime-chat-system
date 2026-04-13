import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { createRoom, getMyChats } from "./chat.controller.js";
const chatRouter = express.Router();

chatRouter.post('/createRoom', authMiddleware, createRoom);
chatRouter.get('/getChats', authMiddleware, getMyChats);

export default chatRouter;