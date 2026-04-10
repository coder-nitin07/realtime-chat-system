import express from "express";
import { loginValidation, registerValidation, validateBody } from "./auth.validation.js";
import { login, refreshToken, register } from "./auth.controller.js";
const authRouter = express.Router();

authRouter.post('/register', validateBody(registerValidation), register);
authRouter.post('/login', validateBody(loginValidation), login);
authRouter.post('/refreshToken', refreshToken);

export default authRouter;