import { registerUser } from "./auth.service.js";

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

export { register };