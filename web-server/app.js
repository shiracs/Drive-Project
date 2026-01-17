import express from 'express';
import apiRoutes from './routes/api.js';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: `./config/.env.${process.env.NODE_ENV || 'local'}` });

const app = express();
const PORT =  process.env.PORT || 5000;
const mongoURI = process.env.CONNECTION_STRING;

mongoose.connect(mongoURI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => {console.error('MongoDB connection error:', err); process.exit(1);});

app.use(cors({
    origin: ['http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Server is listening on port ${PORT}`);
});

export default app;