import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Trop de messages, attends une minute.' },
});

const SYSTEM_PROMPT = `Tu es un assistant nutritionnel expert intégré à l'application FoodGoodScan. Tu aides les utilisateurs avec des questions sur la nourriture, la nutrition, les régimes alimentaires, les calories, les macronutriments, et la santé alimentaire.

Règles importantes :
- Réponds uniquement aux questions liées à la nutrition, l'alimentation, les régimes et la santé
- Si la question n'est pas liée à la nourriture ou nutrition, decline poliment et redirige vers des questions nutritionnelles
- Réponds toujours en français
- Sois précis, pratique et encourageant
- Donne des chiffres concrets quand possible (calories, grammes, etc.)
- Garde tes réponses concises (3-5 phrases max sauf si l'utilisateur demande des détails)`;

router.post('/', authenticateToken, chatLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Service IA non configuré. Contacte le support.' });
      return;
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message requis' });
      return;
    }

    const contents = [
      ...history.slice(-6).map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: message.trim() }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      res.status(502).json({ error: 'Erreur du service IA' });
      return;
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      res.status(502).json({ error: 'Réponse vide du service IA' });
      return;
    }

    res.json({ reply: text });
  } catch (err) {
    console.error('chat error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { router as chatRouter };
