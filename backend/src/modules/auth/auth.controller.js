import { loginUser, registerUser } from "./auth.service.js";
import RefreshToken from "./refreshToken.model.js";

// register api
const register = async (req, res)=>{
    try {
        const { user, token } = await registerUser(req.body);
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            },
            token
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

const login = async (req, res)=>{
    try {
        const { user, accessToken, refreshToken } = await loginUser(req.body);

        // send refresh token in cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict'
        });

        // send accessToken in response with other details
        res.status(200).json({
            message: 'User login successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                avatar: user.avatar
            },
            accessToken
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

export { register, login };