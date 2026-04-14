import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { createRoom, getMessages, getMyChats } from "./chat.controller.js";
const chatRouter = express.Router();

chatRouter.post('/createRoom', authMiddleware, createRoom);
chatRouter.get('/getChats', authMiddleware, getMyChats);
chatRouter.get('/getMessages', authMiddleware, getMessages);

export default chatRouter;