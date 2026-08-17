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
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Service IA non configuré. Contacte le support.' });
      return;
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message requis' });
      return;
    }
    if (message.length > 1000) {
      res.status(400).json({ error: 'Message trop long (maximum 1000 caractères)' });
      return;
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      res.status(502).json({ error: 'Erreur du service IA' });
      return;
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content;
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
