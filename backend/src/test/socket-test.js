import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDdjNDJlZDZhN2ExYmEzYzEyNjI1NyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc1OTAwNDYzLCJleHAiOjE3NzU5MDEzNjN9.M68QLgHA_4mct5WnCH3jQNhIGHWK0Dpl9b3CGTwXCKE",
    },
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

socket.on("connect_error", (err) => {
    console.log("Connection failed:", err.message);
});