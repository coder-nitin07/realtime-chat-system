import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGQwYzEzOTEwYmUxZWM2YjFkOGYyYSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2MDk1MjU2LCJleHAiOjE3NzYwOTYxNTZ9.Cy7e6QxoDqJZwKC5uPylQcS0LyWvD-nE8SUEfZKODJY",
    },
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    // Join room
    socket.emit("join_room", "69dd0ab92035385e1c48626f");

    // Send message after joining
    setTimeout(() => {
        socket.emit("send_message", {
            conversationId: "69dd0ab92035385e1c48626f",
            content: "Hello Goku, I am frieza",
        });
    }, 2000);
});

socket.on("receive_message", (data) => {
    console.log("New Message:", data);
});

socket.on("connect_error", (err) => {
    console.log("Connection failed:", err.message);
});

socket.on("message_error", (err) => {
    console.log("Error:", err.message);
});