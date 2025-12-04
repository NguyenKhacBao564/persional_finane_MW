// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { createServer } from './server.js';
import { env } from './config/env';
import { prisma } from './config/prisma';

const app = createServer();
const port = env.PORT;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('[backend] Database connected');

    const server = app.listen(port, () => {
      console.log(`[backend] Listening on port ${port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`[backend] ${signal} received, closing gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[backend] Database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[backend] Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
