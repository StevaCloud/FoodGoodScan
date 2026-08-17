import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { searchFlippDeals } from '../services/flipp';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Trop de messages, attends une minute.' },
});

// Code régional canadien → code postal représentatif
const AREA_CODE_TO_POSTAL: Record<string, string> = {
  '514': 'H2X1Y6', '438': 'H2X1Y6', '450': 'J4H1R5', '579': 'J4H1R5',
  '418': 'G1R1R5', '581': 'G1R1R5', '819': 'J8X2J2', '873': 'J8X2J2',
  '416': 'M5V2T6', '647': 'M5V2T6', '437': 'M5V2T6', '905': 'L4Z1S2',
  '289': 'L4Z1S2', '365': 'L4Z1S2', '613': 'K1P5G3', '343': 'K1P5G3',
  '519': 'N2G1A1', '226': 'N2G1A1', '705': 'P3A3V8', '249': 'P3A3V8',
  '604': 'V6B1A1', '778': 'V6B1A1', '250': 'V8W1N3', '236': 'V6B1A1',
  '403': 'T2P1J9', '587': 'T2P1J9', '780': 'T5J1R8', '825': 'T5J1R8',
  '204': 'R3C0V8', '431': 'R3C0V8', '306': 'S4P3Y2', '639': 'S4P3Y2',
  '902': 'B3J1S9', '782': 'B3J1S9',
};

function getPostalFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
  return AREA_CODE_TO_POSTAL[local.slice(0, 3)] || 'H2X1Y6';
}

function extractKeywords(message: string): string[] {
  const stops = new Set([
    'avec', 'pour', 'dans', 'une', 'les', 'que', 'qui', 'est', 'sont',
    'comme', 'quand', 'comment', 'donc', 'mais', 'avoir', 'faire', 'aller',
    'veux', 'peux', 'dois', 'repas', 'manger', 'nourriture', 'aliment',
    'recette', 'sain', 'saine', 'santé', 'bon', 'bonne', 'jour', 'soir',
    'midi', 'semaine', 'dîner', 'lunch', 'souper', 'suggère', 'propose',
    'idée', 'aussi', 'très', 'plus', 'moins', 'cette', 'votre', 'notre',
    'leur', 'cette', 'quel', 'quoi', 'tout', 'bien', 'beaucoup', 'puis',
  ]);
  return message.toLowerCase()
    .replace(/[^\wàâäéèêëîïôùûüç\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stops.has(w))
    .slice(0, 3);
}

const SYSTEM_PROMPT = `Tu es un assistant nutritionnel et culinaire expert intégré à l'application FoodGoodScan. Tu aides les utilisateurs avec tout ce qui touche à la nourriture : nutrition, régimes, recettes, listes d'ingrédients, planification de repas, courses, calories, macronutriments et santé alimentaire.

Règles importantes :
- Tu peux aider avec les recettes, listes d'ingrédients, idées de repas, planification de menus et conseils d'achat alimentaire
- Si la question n'est vraiment pas liée à la nourriture ou l'alimentation, decline poliment
- Réponds toujours en français
- Sois précis, pratique et encourageant
- Quand on te demande une liste d'ingrédients ou une recette, donne une liste COMPLÈTE et détaillée
- Donne des quantités concrètes (grammes, tasses, etc.)
- Si des promotions de circulaires sont disponibles dans le contexte, mentionne-les naturellement en indiquant le magasin et le prix`;

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
    if (message.length > 1000) {
      res.status(400).json({ error: 'Message trop long (maximum 1000 caractères)' });
      return;
    }

    // Récupérer le téléphone pour déterminer la région
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { phone: true },
    });

    // Chercher les promotions Flipp selon la région
    let dealsContext = '';
    if (user?.phone) {
      try {
        const postalCode = getPostalFromPhone(user.phone);
        const keywords = extractKeywords(message);
        if (keywords.length > 0) {
          const dealsResults = await Promise.all(
            keywords.map(kw => searchFlippDeals(kw, postalCode))
          );
          const allDeals = dealsResults.flat()
            .filter(d => d.name && d.price && d.merchant)
            .slice(0, 6);

          if (allDeals.length > 0) {
            dealsContext = '\n\n[PROMOTIONS EN COURS DANS TA RÉGION CETTE SEMAINE]\n' +
              allDeals.map(d =>
                `- ${d.name} chez ${d.merchant} : ${d.priceText ? d.priceText + ' ' : ''}$${d.price}`
              ).join('\n');
          }
        }
      } catch {
        // Flipp non critique, on continue sans
      }
    }

    const userMessage = dealsContext
      ? `${message.trim()}${dealsContext}`
      : message.trim();

    const contents = [
      ...history.slice(-6).map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7 },
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

    res.json({ reply: text, hasDeals: dealsContext.length > 0 });
  } catch (err) {
    console.error('chat error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { router as chatRouter };
