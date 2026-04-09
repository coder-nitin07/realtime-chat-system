import mongoose from "mongoose";

const dbConnection = async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`mongoDB connected successfully`);
    } catch (err) {
        console.log(`Error while connecting with the DB: `, err);
        process.exit(1);
    }
};

export default dbConnection;