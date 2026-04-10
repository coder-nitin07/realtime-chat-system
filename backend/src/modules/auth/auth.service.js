import { generateToken } from "../../utils/jwt.js";
import createRefreshToken from "../../utils/refreshToken.js";
import RefreshToken from "./refreshToken.model.js";
import User from "./auth.model.js";
import bcrypt from "bcrypt";

// register the User
const registerUser = async ({ name, username, email, avatar, password })=>{
    if(!name || !username || !email || !password){
        throw { status: 400, message: "All fields are required." };
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });
    if(existingUser){
        throw { status: 409, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));

    const newUser = await User.create({
        name,
        username,
        email,
        avatar,
        password: hashedPassword
    });

    // jwt creation
    const token = generateToken({ id: newUser._id, role: newUser.role });

    return { user: newUser, token };
};

// login User
const loginUser = async ({ email, password })=>{
    if(!email || !password){
        throw { status: 400, message: "Email and Password are required." }
    }

    const existingUser = await User.findOne({ email }).select('+password');
    if(!existingUser){
        throw { status: 401, message: "Invalid credentials" };
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if(!isMatch){
        throw { status: 401, message: "Invalid credentials" };
    }

    // generate tokens
    const accessToken = generateToken({ id: existingUser._id, role: existingUser.role });
    const refreshToken = createRefreshToken();

    // delete old tokens
    await RefreshToken.deleteMany({ userId: existingUser._id });

    // save new refresh token
    await RefreshToken.create({
        userId: existingUser._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    
    const userObj = existingUser.toObject();
    delete userObj.password;

    // service not touch DB here
    return { user: userObj, accessToken, refreshToken };
};

// generate new access token 
const getNewAccessToken = async (userId) =>{
    const existingUser = await User.findById(userId).select('_id role');
    if(!existingUser){
        throw { status: 401, message: "User not found" };
    }

    // generate access token
    const accessToken = generateToken({ id: existingUser._id, role: existingUser.role });

    return { accessToken };
};

// logout service
const logoutUser = async (token) =>{
    if(!token){
        return;
    }

    // delete this session from DB
    await RefreshToken.deleteOne({ token });
};

export { registerUser, loginUser, getNewAccessToken, logoutUser };