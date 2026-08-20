import { Router, Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const BARCODE_REGEX = /^\d{8,14}$/;

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier image requis'));
  },
});

// POST /api/product-images/:barcode
router.post('/:barcode', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const barcode = String(req.params.barcode);
    const userId = req.userId!;

    if (!BARCODE_REGEX.test(barcode)) {
      res.status(400).json({ error: 'Code-barres invalide (8 à 14 chiffres requis)' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Image requise' });
      return;
    }

    const host = process.env.SERVER_URL || `http://165.22.8.129:3001`;
    const imageUrl = `${host}/uploads/products/${req.file.filename}`;

    await prisma.productImage.upsert({
      where: { barcode },
      create: { barcode, imageUrl, userId },
      update: { imageUrl, userId },
    });

    res.json({ imageUrl });
  } catch (err) {
    console.error('image upload error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// POST /api/product-images/:barcode/nutrition — photo du tableau nutritif
router.post('/:barcode/nutrition', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const barcode = String(req.params.barcode);
    if (!BARCODE_REGEX.test(barcode)) {
      res.status(400).json({ error: 'Code-barres invalide' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Image requise' });
      return;
    }
    const host = process.env.SERVER_URL || `http://165.22.8.129:3001`;
    const nutritionLabelUrl = `${host}/uploads/products/${req.file.filename}`;
    const userId = req.userId!;
    await prisma.productCorrection.updateMany({
      where: { barcode, userId },
      data: { nutritionLabelUrl },
    });
    res.json({ nutritionLabelUrl });
  } catch (err) {
    console.error('nutrition label upload error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// GET /api/product-images/:barcode
router.get('/:barcode', async (req: Request, res: Response) => {
  try {
    const img = await prisma.productImage.findUnique({
      where: { barcode: String(req.params.barcode) },
    });
    res.json({ imageUrl: img?.imageUrl || null });
  } catch {
    res.json({ imageUrl: null });
  }
});

export { router as productImagesRouter };
