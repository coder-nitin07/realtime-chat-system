import { createChat, fetchOlderChats, getChats } from "./chat.service.js";

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

// getMychats api
const getMyChats = async (req, res)=>{
    try {
        const getUser = req.user.id;
        const getChat = await getChats({ getUser });

        res.status(200).json({ 
            message: 'Fetched All Chats successfully',
            getChat
        })
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

const getMessages = async (req, res)=>{
    try {
        const { conversationId } = req.query;
        const messages = await fetchOlderChats({ conversationId });


        
        res.status(200).json({
            message: 'Messages Fetched Successfully',
            data: messages
        });
    } catch (err) {
        console.log(`Something went wrong`, err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error"
        });
    }
};

export { createRoom, getMyChats, getMessages };