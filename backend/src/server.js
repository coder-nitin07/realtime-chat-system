import app from './app.js';
import dotenv from 'dotenv';
import dbConnection from './config/db.js';
dotenv.config();

const PORT = process.env.PORT || 5000;
const startServer = async () =>{
    try {
        await dbConnection();

        app.listen(PORT, ()=>{
            console.log(`Server is running on PORT ${ PORT }`);
        });
    } catch (err) {
        console.log(`Failed to start server`, err);
        process.exit(1);
    }
};

startServer();