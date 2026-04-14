import { pubClient } from "../../config/redis.js";
import User from "../auth/auth.model.js";

// getAllUsers
const getAllUsers = async (currentUserId, searchText, page, limit)=>{
    const skip = (page - 1) * limit;

    let query = {
        _id: { $ne: currentUserId }
    };

    // search by name
    if (searchText) {
        query.$or = [
            { name: { $regex: searchText, $options: 'i' } }
        ];
    }

    // get the Online Users from Redis (ONE TIME Call)
    const onlineUsers = await pubClient.sMembers('online_users');
    const onlineSet = new Set(onlineUsers);

    // fetch users from DB
    const users = await User.find(query)
        .select('_id name username avatar')
        .skip(skip)
        .limit(limit);

    // merge online Status
    const userWithStatus = users.map(user =>{
        return {
            ...user.toObject(),
            isOnline: onlineSet.has(user._id.toString())
        }
    });

    const totalUsers = await User.countDocuments(query);
    
    return {
        users: userWithStatus, 
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit)
    };
};

export { getAllUsers };