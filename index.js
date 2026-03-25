const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');



const app = express()

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to database");
    })
    .catch(err=>{
        console.log(err)
    })


app.get('/', (req, res)=>{
    res.json({message: "Welcome to project one"})
});


app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
} );