import { getAllUsers } from "./user.service.js";

// Get All Users
const fetchUsers = async (req, res)=>{
    try {
        const user = await getAllUsers(req.user.id);

        res.status(200).json({
            message: 'User Fetched Successfully',
            users: user
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

export { fetchUsers };