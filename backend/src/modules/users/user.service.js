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

    const users = await User.find(query)
        .select('_id name username avatar isOnline')
        .skip(skip)
        .limit(limit);

    const totalUsers = await User.countDocuments(query);
    
    return {
        users, 
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit)
    };
};

export { getAllUsers };