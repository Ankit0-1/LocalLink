import express from 'express';
import { prisma } from './lib/prisma.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
  }
});

app.listen(port, () => {
  console.log(`LocalLink API listening on port ${port}`);
});
