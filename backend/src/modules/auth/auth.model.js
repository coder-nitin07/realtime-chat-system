import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 15,
        index: true,
        lowercase: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        index: true,
        trim: true
    },
    avatar: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuIHxYERk65e_fAg_OfuLTiawQ5IQRMva9Zw&s"
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: [ "user", "admin" ],
        default: "user"
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    }
},{ timestamps: true });

const User = mongoose.model('User', authSchema);
export default User;