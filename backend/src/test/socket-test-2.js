import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    transports: ["polling", "websocket"],
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGQwYTY3MjAzNTM4NWUxYzQ4NjI2YyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2MzQ3NTk0LCJleHAiOjE3NzYzNDg0OTR9.ibVAokcVhjLYKlWp5lcI1BGk1SJ8__B25s9_WlL77Fw",
    },
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    const conversationId = "69dd0ab92035385e1c48626f";

    // Join room
    socket.emit("join_room", conversationId);

    // Send message after 3 sec
    setTimeout(() => {
        socket.emit("send_message", {
            conversationId,
            content: "User 2 Messsage 1",
        });
    }, 3000);
});

// Receive message (ONLINE + OFFLINE same format)
socket.on("receive_message", (data) => {
    console.log("Message received:", data);
});

socket.on("connect_error", (err) => {
    console.log("Connection failed:", err.message);
});

socket.on("message_error", (err) => {
    console.log("Error:", err.message);
});