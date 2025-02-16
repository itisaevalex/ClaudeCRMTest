// server.ts
import cors from 'cors';
import app from './app';
import routes from './routes';
import express from 'express';

const PORT = process.env.PORT || 5173;

app.use(cors({
   origin: ['http://localhost:3000', 'http://localhost:5173'], // Include both Vite's default port and your custom port
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization'],
   credentials: true
 }));

app.use(express.json());

app.use(routes);

app.listen(PORT, () => {
   console.log(`Server is running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
   res.send('Backend is running!');
});