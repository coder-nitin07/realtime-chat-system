import { createClient } from "redis";

const pubClient = createClient({
    url: 'redis://localhost:6379'
});

const subClient = createClient({
    url: 'redis://localhost:6379'
});

// Error handling
pubClient.on('error', (err) => console.error('PubClient Error', err));
subClient.on('error', (err) => console.error('SubClient Error', err));

// connect function
export const connectRedis = async ()=>{
    try {
        await pubClient.connect();
        await subClient.connect();
        console.log('Redis connected Successfully');
    } catch (err) {
        console.error('Redis connection Failed', err);
    }
};

// export the clients
export { pubClient, subClient }; 