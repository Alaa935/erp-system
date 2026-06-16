import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ERP API is running', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
