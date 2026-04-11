import User from "../auth/auth.model.js";

// getAllUsers
const getAllUsers = async (currentUserId)=>{
    const users =await User.find({
        _id: { $ne: currentUserId } 
    }).select('_id name username avatar isOnline');
    
    return users;
};

export { getAllUsers };