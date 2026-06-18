import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { productRouter } from './routes/products';
import { subscriptionRouter } from './routes/subscriptions';
import { dealRouter } from './routes/deals';
import { categoryRouter } from './routes/categories';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/deals', dealRouter);
app.use('/api/categories', categoryRouter);

app.get('/api/image-proxy', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) { res.status(400).send('URL required'); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch {
    res.status(404).send('');
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`FoodCheck server running on port ${PORT}`);
});
