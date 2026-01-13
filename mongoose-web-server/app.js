import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// TODO: Update the route imports as per your project structure
const articles = require('./routes/article');
const categories = require('./routes/category');

require('custom-env').env(process.env.NODE_ENV, './config');


mongoose.connect(process.env.CONNECTION_STRING);

dotenv.config();
const app = express();
const PORT =  5000;

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({extended: true}));

// TODO: Define and import your API routes
app.use('/articles', articles);
app.use('/categories', categories);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Server is listening on port ${PORT}`);
});

export default app;