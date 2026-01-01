import express from 'express';
import apiRoutes from './routes/api.js';

const app = express();
const PORT =  5000;

app.use(express.json());
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Web Server is listening on port ${PORT}`);
});

export default app;