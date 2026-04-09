import { generateToken } from "../../utils/jwt.js";
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

export { registerUser };