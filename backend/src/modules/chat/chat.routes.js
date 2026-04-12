import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { createRoom } from "./chat.controller.js";
const chatRouter = express.Router();

chatRouter.post('/createRoom', authMiddleware, createRoom);

export default chatRouter;