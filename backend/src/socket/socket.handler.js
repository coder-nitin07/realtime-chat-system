import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { saveMessage } from "../modules/chat/chat.service.js";
import { pubClient, subClient } from "../config/redis.js";
import Conversation from "../modules/chat/conversation.model.js";

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: "*" },
        transports: ["polling", "websocket"],
    });

    // ----------------------------
    // AUTH MIDDLEWARE
    // ----------------------------
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication Failed: No Token"));
        }

        try {
            const decoded = verifyToken(token);
            if (!decoded) {
                return next(new Error("Authentication Failed: Invalid Token"));
            }

            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error("Authentication failed"));
        }
    });

    // ----------------------------
    // TRACK ONLINE USERS (LOCAL)
    // ----------------------------
    const onlineUsers = new Map();

    io.on("connection", (socket) => {
        const userId = socket.user.id;

        // ----------------------------
        // HANDLE ONLINE USERS
        // ----------------------------
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        // Add to Redis
        setImmediate(async () => {
            await pubClient.sAdd("online_users", userId);
        });

        console.log("User connected:", userId);

        // ----------------------------
        // DELIVER OFFLINE MESSAGES
        // ----------------------------
        const offlineKey = `offline:${userId}:messages`;

        setTimeout(async () => {
            const pendingMessages = await pubClient.lRange(offlineKey, 0, -1);

            if (pendingMessages.length > 0) {
                console.log(`Delivering ${pendingMessages.length} offline messages`);

                pendingMessages.forEach((msg) => {
                    socket.emit("receive_message", JSON.parse(msg));
                });

                await pubClient.del(offlineKey);
            }
        }, 500); // small delay to ensure client ready

        // ----------------------------
        // JOIN ROOM
        // ----------------------------
        socket.on("join_room", (conversationId) => {
            socket.join(conversationId);
            console.log(`User joined room: ${conversationId}`);
        });

        // ----------------------------
        // LEAVE ROOM
        // ----------------------------
        socket.on("leave_room", (conversationId) => {
            socket.leave(conversationId);
        });

        // ----------------------------
        // SEND MESSAGE
        // ----------------------------
        socket.on("send_message", async ({ conversationId, content }) => {
            try {
                const senderId = socket.user.id;

                // Save in DB
                const savedMessage = await saveMessage({
                    conversationId,
                    senderId,
                    content,
                });

                const messageData = {
                    conversationId,
                    message: savedMessage,
                };

                // Invalidate cache
                await pubClient.del(`chat:${conversationId}:messages`);

                // ----------------------------
                // HANDLE OFFLINE USERS
                // ----------------------------
                const conversation = await Conversation.findById(conversationId).select("participants");

                const receivers = conversation.participants.filter(
                    (id) => id.toString() !== senderId.toString()
                );

                for (const receiverId of receivers) {
                    const isOnline = await pubClient.sIsMember(
                        "online_users",
                        receiverId.toString()
                    );

                    console.log("Receiver:", receiverId, "Online:", isOnline);

                    if (!isOnline) {
                        const key = `offline:${receiverId}:messages`;

                        await pubClient.rPush(key, JSON.stringify(messageData));
                        await pubClient.lTrim(key, -50, -1);
                        await pubClient.expire(key, 3600);

                        console.log(`Stored offline for ${receiverId}`);
                    }
                }

                // Publish to Redis
                await pubClient.publish("chat_messages", JSON.stringify(messageData));

            } catch (err) {
                console.log("Error:", err);
                socket.emit("message_error", { message: err.message });
            }
        });

        // ----------------------------
        // DISCONNECT
        // ----------------------------
        socket.on("disconnect", async () => {
            console.log("Disconnected:", socket.id);

            if (onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets.delete(socket.id);

                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);

                    // CRITICAL FIX
                    await pubClient.sRem("online_users", userId);

                    console.log("User fully offline:", userId);
                }
            }
        });
    });

    // ----------------------------
    // REDIS SUBSCRIBER
    // ----------------------------
    subClient.subscribe("chat_messages", (message) => {
        const data = JSON.parse(message);

        const { conversationId } = data;

        // Send SAME structure everywhere
        io.to(conversationId).emit("receive_message", data);
    });

    return io;
};

export const getIO = () => io;