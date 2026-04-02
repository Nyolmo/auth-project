const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRouter = require('./routers/authRouter');
const postsRouter = require('./routers/postsRouter');



const app = express()

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth',authRouter)
app.use('/api/posts', postsRouter);


mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to database");
    })
    .catch(err=>{
        console.log(err)
    });


app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
} );