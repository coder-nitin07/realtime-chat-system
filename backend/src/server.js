import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import http from "http";
import dbConnection from './config/db.js';
import { initSocket } from './socket/socket.handler.js';
import { connectRedis } from './config/redis.js';

const PORT = process.env.PORT || 5000;
const startServer = async () =>{
    try {
        await dbConnection();

        await connectRedis();

        const server = http.createServer(app);

        // attach socket to server
        initSocket(server);

        server.listen(PORT, ()=>{
            console.log(`Server is running on PORT ${ PORT }`);
        });
    } catch (err) {
        console.log(`Failed to start server`, err);
        process.exit(1);
    }
};

startServer();