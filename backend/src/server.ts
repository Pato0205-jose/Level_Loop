import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { progressRouter } from './routes/progress.js';
import { achievementsRouter } from './routes/achievements.js';
import { notificationsRouter } from './routes/notifications.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { env } from './lib/env.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(
  cors({
    origin: isProd ? env.FRONTEND_ORIGIN : true,
    credentials: true,
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'Level Loop API' });
});

app.use('/auth', authRouter);
app.use('/progress', progressRouter);
app.use('/achievements', achievementsRouter);
app.use('/notifications', notificationsRouter);
app.use('/leaderboard', leaderboardRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Level Loop API listening on http://0.0.0.0:${env.PORT}`);
});
