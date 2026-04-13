import Conversation from "./conversation.model.js";

// chat api creation
const createChat = async ({ currentUser, participants, type, groupName, admin, lastMessage })=>{
    if(type === 'private'){
        // validate the participents
        if(!participants || participants.length !== 2){
            throw { status: 400, message: "Private chat requires exactly 2 users" };
        }

        const firstUser = participants[0];
        const secondUser = participants[1];
        

        // find existing conversation
        const existingConversation = await Conversation.findOne({
            type: 'private',
            participants: { $all: [ firstUser, secondUser ] }
        });

        // if conversation exist return that one
        if(existingConversation){
            return existingConversation;
        }

        // create new conversation room
        const newConversationRoom = await Conversation.create({
            participants: [ firstUser, secondUser ],
            type: 'private'
        });

        return newConversationRoom;
    }
    else if(type === 'group'){
         // validate the participents
        if(!participants || participants.length < 2){
            throw { status: 400, message: "Group chat requires at least 2 users" };
        }

        const adminUser = currentUser;

        // removee the admin if exist in participants
        const filteredParticipants = participants.filter(
            (id) => id !== adminUser
        );

        // include admin in participants
        const finalParticipants = [ adminUser, ...filteredParticipants ];

        const newConversationRoom = await Conversation.create({
            participants: finalParticipants,
            type: "group",
            groupName,
            admin: adminUser
        });

        return newConversationRoom;
    }
};

// getChats service
const getChats = async ({ getUser })=>{
    const findUserChats = await Conversation.find({
         participants: getUser
    });

    if(findUserChats.length <= 0){
        return [];
    }

    return findUserChats;
};

export { createChat, getChats };