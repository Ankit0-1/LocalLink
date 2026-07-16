import express from 'express';
import { prisma } from './lib/prisma.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    res.json({ success: true, data: { status: 'ok', database: 'connected' } });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection unavailable' });
  }
});

app.listen(port, () => {
  console.log(`LocalLink API listening on port ${port}`);
});
