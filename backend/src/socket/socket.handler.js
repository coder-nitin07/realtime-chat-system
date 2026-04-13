import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";

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