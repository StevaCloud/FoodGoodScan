import { Router, Response, Request } from 'express';
import { CATEGORIES } from '../services/categories';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
  })));
});

export { router as categoryRouter };
