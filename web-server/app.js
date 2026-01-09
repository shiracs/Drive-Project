import express from 'express';
import apiRoutes from './routes/api.js';
import cors from 'cors';

const app = express();
const PORT =  5000;
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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