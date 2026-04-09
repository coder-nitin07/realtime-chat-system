import express from "express";
const app = express();

app.get('/', (req, res)=>{
    res.send('Real Time Chat App is running....');
});

export default app;