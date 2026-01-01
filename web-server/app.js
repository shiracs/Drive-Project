import express from 'express';
import apiRoutes from './routes/api.js';
import cors from 'cors';

const app = express();
const PORT =  5000;

app.use(cors({
    origin: '*', // לצרכי בדיקה בלבד, כדי לוודא שזו לא הבעיה
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Server is listening on port ${PORT}`);
});

export default app;