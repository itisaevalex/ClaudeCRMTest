// src/app.ts
import express from 'express';
import cors from 'cors';
import bookingRoutes from './routes/bookingRoutes';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

export default app;