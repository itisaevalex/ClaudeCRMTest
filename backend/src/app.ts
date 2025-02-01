import express from 'express';
import cors from 'cors';

const app = express();

// More specific CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend Vite server
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

export default app;