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
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Request/Response Logging Middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    console.log('\n' + '='.repeat(80));
    console.log(`📨 [${timestamp}] ${req.method} ${req.path}`);
    console.log(`   URL: ${req.originalUrl}`);
    console.log(`   Headers:`, {
        'Content-Type': req.headers['content-type'],
        'Authorization': req.headers['authorization'] ? '***' : 'None'
    });
    
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`   Body:`, JSON.stringify(req.body, null, 2));
    }
    
    // Capture original res.json to log response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
        const duration = Date.now() - startTime;
        console.log(`\n📤 Response [${res.statusCode}] - ${duration}ms`);
        console.log(`   Data:`, JSON.stringify(data, null, 2));
        console.log('='.repeat(80));
        return originalJson(data);
    };
    
    // Capture original res.send for plain text responses
    const originalSend = res.send.bind(res);
    res.send = function(data) {
        const duration = Date.now() - startTime;
        console.log(`\n📤 Response [${res.statusCode}] - ${duration}ms`);
        console.log(`   Data:`, data);
        console.log('='.repeat(80));
        return originalSend(data);
    };
    
    next();
});

// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Server is listening on port ${PORT}`);
});

export default app;