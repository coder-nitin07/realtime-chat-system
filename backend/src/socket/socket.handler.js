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

    // connection for verification
    io.on('connection', (socket)=>{
        console.log(`User connected`, socket.user.id);

        socket.on('disconnect', ()=>{
            console.log(`User disconnected`, socket.user.id);
        });
    });

    return io;
};

export const getIO = ()=> io;