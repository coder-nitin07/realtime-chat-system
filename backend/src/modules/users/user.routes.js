import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { fetchUsers } from "./user.controller.js";
const userRouter = express.Router();

userRouter.get('/getUsers', authMiddleware, fetchUsers);

export default userRouter;