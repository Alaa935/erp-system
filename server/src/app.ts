import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const corsOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
const corsWildcardOrigins = env.CORS_WILDCARD_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);

console.log('[CORS] CORS_ORIGIN =', env.CORS_ORIGIN);
console.log('[CORS] Parsed exact origins:', corsOrigins);
console.log('[CORS] CORS_WILDCARD_ORIGINS =', env.CORS_WILDCARD_ORIGINS);
console.log('[CORS] Parsed wildcard patterns:', corsWildcardOrigins);

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    for (const pattern of corsWildcardOrigins) {
      if (pattern.startsWith('*.') && origin.endsWith(pattern.slice(1))) {
        return callback(null, true);
      }
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ERP API is running', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
