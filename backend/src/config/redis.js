import dotenv from 'dotenv';
dotenv.config();
import { createClient } from "redis";

const pubClient = createClient({
    url: process.env.REDIS_URI
});

const subClient = createClient({
    url: process.env.REDIS_URI
});

// Error handling
pubClient.on('error', (err) => console.error('PubClient Error', err));
subClient.on('error', (err) => console.error('SubClient Error', err));

// connect function
export const connectRedis = async ()=>{
    try {
        if(!pubClient.isOpen){
            await pubClient.connect();
        }

        if(!subClient.isOpen){
            await subClient.connect();
        }

        console.log('Redis connected Successfully');
    } catch (err) {
        console.error('Redis connection Failed', err);
    }
};

// export the clients
export { pubClient, subClient }; 