import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { saveMessage } from "../modules/chat/chat.service.js";
import { pubClient, subClient } from "../config/redis.js";

let io;

export const initSocket = (httpServer)=>{
    io = new Server(httpServer, {
        cors: { origin: '*' }
    });

    // socket middleware
    io.use((socket, next)=>{
        try {
            // get token from Client
            const token = socket.handshake.auth?.token;

            if(!token){
                return next(new Error('Authentication Failed: No Token'));
            }

            // verify token
            const decoded = verifyToken(token);
            if(!decoded){
                return next(new Error('Authentication Failed: Invalid Token'));
            }

            // attach user to socket
            socket.user = decoded;

            next();
        } catch (err) {
            return next(new Error("Authentication failed"));
        }
    });

    // track sockets per User
    const onlineUsers = new Map();

    // users online
    io.on('connection', async (socket)=>{
        const userId = socket.user.id;

        // ----------------------------
        // Handle Online Users
        // ----------------------------
        if(!onlineUsers.has(userId)){
            onlineUsers.set(userId, new Set());
        }

        // add current socket
        onlineUsers.get(userId).add(socket.id);


        // add to Redis
        await pubClient.sAdd('online_users', userId);

        console.log('User connected', userId);
        console.log('Online Users', onlineUsers.size);

        // Join Room
        socket.on("join_room", (conversationId) => {
            socket.join(conversationId);
            console.log(`User joined room: ${ conversationId }`);
        });

        // Leave Room
        socket.on("leave_room", (conversationId) => {
            socket.leave(conversationId);
            console.log(`User left room: ${ conversationId }`);
        });


        // --------------------------------
        // Send Message
        // --------------------------------
        socket.on("send_message", async ({ conversationId, content }) => {
            try {
                const senderId = socket.user.id;
                
                // Save in DB
                const savedMessage = await saveMessage({
                    conversationId,
                    senderId,
                    content
                });

                const messageData = {
                    conversationId,
                    message: savedMessage
                }

                // Invalidate cache
                await pubClient.del(`chat:${conversationId}:messages`);
 
                // publish to Redis
                await pubClient.publish("chat_messages", JSON.stringify(messageData));

                // emit locally (FAST)
                io.to(conversationId).emit("receive_message", savedMessage);

            } catch (err) {
                console.log("Error saving message", err );

                socket.emit("message_error", {
                    message: err.message
                });
            }
        });


        // disconnect users
        socket.on('disconnect', ()=>{
            console.log('Socket Disconnection', socket.id);

            if (onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);

                userSockets.delete(socket.id);

                // if no active sockers user offline
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    console.log("User fully offline:", userId);
                }
            }
        });
    });

    // subscriber run once
    subClient.subscribe('chat_messages', (message)=>{
        const data = JSON.parse(message);

        const { conversationId, message: msg } = data;

        // emit to room (other servers)
        io.to(conversationId).emit('receive_message', msg);
    });

    return io;
};

export const getIO = ()=> io;