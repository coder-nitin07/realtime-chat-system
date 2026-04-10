import express from "express";
import { loginValidation, registerValidation, validateBody } from "./auth.validation.js";
import { login, logout, logoutAll, refreshToken, register } from "./auth.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
const authRouter = express.Router();

authRouter.post('/register', validateBody(registerValidation), register);
authRouter.post('/login', validateBody(loginValidation), login);
authRouter.post('/refreshToken', refreshToken);
authRouter.post('/logout', logout);
authRouter.post('/logout-all', authMiddleware, logoutAll);

export default authRouter;