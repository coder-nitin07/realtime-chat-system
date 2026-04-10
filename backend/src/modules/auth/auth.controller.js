import User from "./auth.model.js";
import { getNewAccessToken, loginUser, logoutAllDevices, logoutUser, registerUser } from "./auth.service.js";
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

// login api
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

// refreshToken api
const refreshToken = async (req, res)=>{
    try {
        const token = req.cookies.refreshToken;
        if(!token){
            return res.status(401).json({ message: 'No refresh Token provided' });
        }

        // check in DB
        const storedToken = await RefreshToken.findOne({ token });
        if (!storedToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        // generate new access token
        const { accessToken } = await getNewAccessToken(storedToken.userId);

        res.status(200).json({
            message: 'New Access Token Generated',
            accessToken
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

// logout api
const logout = async (req, res)=>{
    try {
        const token = req.cookies.refreshToken;
        
        // call service
        await logoutUser(token);

        // clear cookies
        res.clearCookie('refreshToken');

        // success
        res.status(200).json({ message: "Logged Out Successfully" });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};


// logout from all device api
const logoutAll = async (req, res)=>{
    try {
        const userId = req.user.id;

        // call services
        await logoutAllDevices(userId);

        // clear cookie (current devi e)
        res.clearCookie('refreshToken');

        res.status(200).json({
            message: 'Logged out from all devices successfully'
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

export { register, login, refreshToken, logout, logoutAll };