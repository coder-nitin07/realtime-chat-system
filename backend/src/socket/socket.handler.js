import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { saveMessage } from "../modules/chat/chat.service.js";

let io;

export const initSocket = (httpServer)=>{
    io = new Server(httpServer, {
        cors: {
            origin: '*'
        }
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

    const onlineUsers = new Map();

    // users online
    io.on('connection', (socket)=>{
        const userId = socket.user.id;

        // we ensure user exist in map
        if(!onlineUsers.has(userId)){
            onlineUsers.set(userId, new Set());
        }

        // add current socket
        onlineUsers.get(userId).add(socket.id);

        console.log('User connected', userId);
        console.log('Online Users', onlineUsers.size);

        socket.on("join_room", (conversationId) => {
            socket.join(conversationId);
            console.log(`User joined room: ${ conversationId }`);
        });

        socket.on("leave_room", (conversationId) => {
            socket.leave(conversationId);
            console.log(`User left room: ${ conversationId }`);
        });

        socket.on("send_message", async ({ conversationId, content }) => {
            try {
                const senderId = socket.user.id;
                
                const savedMessage = await saveMessage({
                    conversationId,
                    senderId,
                    content
                });

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

    return io;
};

export const getIO = ()=> io;