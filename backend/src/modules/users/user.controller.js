import { getAllUsers } from "./user.service.js";

// Get All Users
const fetchUsers = async (req, res)=>{
    try {
        const currentUserId = req.user.id;
        const searchText = (req.query.search || '').trim();

        const DEFAULT_LIMIT = 10;
        const MAX_LIMIT = 30;

        // page 
        let page = parseInt(req.query.page);
        if(isNaN(page) || page < 1) page = 1;

        // limit
        let limit = parseInt(req.query.limit);
        if(isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;

        if(limit > MAX_LIMIT) limit =  MAX_LIMIT;        

        const user = await getAllUsers(
            currentUserId,
            searchText,
            page,
            limit
        );

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