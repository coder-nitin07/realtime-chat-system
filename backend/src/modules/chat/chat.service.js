import { pubClient } from "../../config/redis.js";
import Conversation from "./conversation.model.js";
import Message from "./message.model.js";

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
    try {
        const cacheKey = `user:${ getUser }:chats`;

        // check the redis cache first
        const cachedChats = await pubClient.lRange(cacheKey, 0, -1);

        if(cachedChats.length > 0){
            console.log('Cache HIT');

            return cachedChats.map(chat => JSON.parse(chat));
        }

        console.log('Cache Miss');

        // fetch from DB
        const findUserChats = await Conversation.find({
            participants: getUser
        });

        if(!findUserChats.length){
            return [];
        }

        // store in Redis Cache
        await pubClient.del(cacheKey); // clear the older cache

        for(const chat of findUserChats){
            await  pubClient.rPush(cacheKey, JSON.stringify(chat));
        }

        // cache expiryt time
        await pubClient.expire(cacheKey, 3600);

        return findUserChats;
    } catch (err) {
        console.log('getChats:', err);
        throw err;
    }
};

// save message in DB
const saveMessage = async ({ conversationId, senderId, content })=>{
    console.log("first", senderId);
    const existingChatUser = await Conversation.findOne({
        _id: conversationId,
        participants: senderId
    });

    if(!existingChatUser){
        throw new Error('User not part of this Conversation.')
    }

    const newMessage = await Message.create({
        conversationId,
        senderId,
        content
    });

    return newMessage;
};

// fetch plder chats
const fetchOlderChats = async ({ conversationId })=>{
    const limit = 10;

    const cacheKey = `chat:${ conversationId }:messages`;
    const cachedMessages = await pubClient.lRange(cacheKey, 0, -1);

    if(cachedMessages.length > 0){
        console.log(`Cached Hit`);

        return cachedMessages.map(msg => JSON.parse(msg));
    }

    console.log('Cache Miss');

    const messages = await Message.find({
        conversatioId: conversationId
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    // store in Redis
    for (const msg of messages) {
        await pubClient.rPush(cacheKey, JSON.stringify(msg));
    }

    // set TTL
    await pubClient.expire(cacheKey, 3600);

    return messages;
};

const handleSendMessage = async ({ conversationId, senderId, content }) => {

    // 1. Save message (reuse existing)
    const savedMessage = await saveMessage({
        conversationId,
        senderId,
        content,
    });

    const messageData = {
        conversationId,
        message: savedMessage,
    };

    // 2. Invalidate cache
    await pubClient.del(`chat:${conversationId}:messages`);

    // 3. Get conversation members
    const conversation = await Conversation.findById(conversationId).select("participants");

    const receivers = conversation.participants.filter(
        (id) => id.toString() !== senderId.toString()
    );

    // 4. Handle offline users
    for (const receiverId of receivers) {
        const isOnline = await pubClient.sIsMember(
            "online_users",
            receiverId.toString()
        );

        if (!isOnline) {
            const key = `offline:${receiverId}:messages`;

            await pubClient.rPush(key, JSON.stringify(messageData));
            await pubClient.lTrim(key, -50, -1);
            await pubClient.expire(key, 3600);
        }
    }

    // 5. Publish to Redis
    await pubClient.publish("chat_messages", JSON.stringify(messageData));

    return messageData;
};

export { createChat, getChats, saveMessage, fetchOlderChats, handleSendMessage };