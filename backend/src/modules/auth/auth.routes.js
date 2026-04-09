import express from "express";
import { registerValidation, validateBody } from "./auth.validation.js";
import { register } from "./auth.controller.js";
const authRouter = express.Router();

authRouter.post('/register', validateBody(registerValidation), register);

export default authRouter;