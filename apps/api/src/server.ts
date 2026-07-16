import 'dotenv/config';
import express from 'express';
import { prisma } from './lib/prisma.js';
import authRouter from './routes/auth.js';

const app = express();
const port = Number(process.env.PORT ?? 3005);

app.use(express.json());
app.use('/api/auth', authRouter);

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

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'An unexpected server error occurred' });
});

app.listen(port, () => {
  console.log(`LocalLink API listening on port ${port}`);
});
