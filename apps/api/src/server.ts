import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { prisma } from './lib/prisma.js';
import { initSocketServer } from './lib/socket.js';
import { cors } from './middleware/cors.js';
import authRouter from './routes/auth.js';
import customerRouter from './routes/customer.js';
import deliveryRouter from './routes/delivery.js';
import vendorRouter from './routes/vendor.js';

const app = express();
const port = Number(process.env.PORT ?? 3005);

app.use(cors);
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/delivery', deliveryRouter);

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

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'An unexpected server error occurred' });
});

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`LocalLink API listening on port ${port}`);
});
