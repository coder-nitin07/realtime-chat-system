import { createChat } from "./chat.service.js";

// create chat api
const createRoom = async (req, res)=>{
    try {
        const { participants, type, groupName } = req.body;
        
        const room = await createChat({
            currentUser: req.user.id,
            participants,
            type,
            groupName
        });

        res.status(201).json({
            message: 'Conversation create successfully',
            room
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

export { createRoom };