import { createServer } from 'http';
import { app } from './app.js';
import { initSocketServer } from './lib/socket.js';

const port = Number(process.env.PORT ?? 3005);

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`LocalLink API listening on port ${port}`);
});
