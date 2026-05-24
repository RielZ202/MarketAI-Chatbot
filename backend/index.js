import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;

// ─── System Prompt ──────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `
Kamu adalah MarketAI-AI, asisten analisis MarketAI pasar keuangan canggih yang membantu investor Indonesia memahami kondisi pasar.

KEMAMPUAN UTAMA:
1. Analisis MarketAI berita ekonomi (Bullish / Bearish / Netral) dengan skor 0-100
2. Dampak terhadap aset: Saham, Crypto, Forex, Komoditas
3. Ringkasan berita ekonomi harian dari sumber terpercaya
4. Rekomendasi watchlist aset berdasarkan kondisi pasar
5. Penjelasan istilah trading dalam bahasa sederhana

FORMAT RESPONS:
- Selalu gunakan Bahasa Indonesia yang jelas dan profesional
- Untuk analisis berita: berikan MarketAI (Bullish/Bearish/Netral), SKOR (0-100), DAMPAK per aset, dan REKOMENDASI singkat
- Gunakan emoji yang relevan: 📈 Bullish, 📉 Bearish, ⚖️ Netral, 🔥 High impact, ⚠️ Perhatian
- Selalu ingatkan bahwa ini bukan saran investasi resmi

ASET POPULER INDONESIA:
- Saham: BBCA, BBRI, TLKM, ASII, GOTO, BREN, MDKA
- Crypto: BTC, ETH, BNB, SOL, DOGE
- Forex: USD/IDR, EUR/IDR, JPY/IDR
- Komoditas: Emas, Nikel, CPO (Minyak Sawit), Batubara

Jika pengguna bertanya tentang aset spesifik, analisis dampak MarketAI berita terkini terhadap aset tersebut.
Jika tidak ada berita spesifik, berikan panduan umum berdasarkan kondisi makro global.

PENTING: Selalu tambahkan disclaimer bahwa analisis ini bersifat edukatif, bukan saran investasi profesional.
`;

// ─── Mock Market Data (in production, replace with real API like NewsAPI, Alpha Vantage) ─
const MARKET_CONTEXT = {
  lastUpdated: new Date().toISOString(),
  indices: {
    IHSG: { value: 7124.5, change: +0.34 },
    BTC: { value: 67420, change: -1.2 },
    Gold: { value: 2345, change: +0.8 },
    USDIDR: { value: 16250, change: -0.15 }
  }
};

// ─── Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get market snapshot
app.get('/api/market', (req, res) => {
  res.json(MARKET_CONTEXT);
});

// Main chat endpoint with conversation history
app.post('/api/chat', async (req, res) => {
  const { conversation, watchlist = [] } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      throw new Error('conversation harus berupa array');
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    // Inject watchlist context into the system prompt if user has assets
    let systemInstruction = SYSTEM_INSTRUCTION;
    if (watchlist.length > 0) {
      systemInstruction += `\n\nWATCHLIST PENGGUNA SAAT INI: ${watchlist.join(', ')}. 
      Prioritaskan analisis dampak terhadap aset-aset ini dalam setiap respons.`;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.75,
        maxOutputTokens: 1024,
        systemInstruction
      }
    });

    const text = response.text;

    // Simple MarketAI detection from response
    let MarketAI = 'neutral';
    const lowerText = text.toLowerCase();
    const bullishWords = ['bullish', 'naik', 'positif', 'menguat', 'rally', 'optimis'];
    const bearishWords = ['bearish', 'turun', 'negatif', 'melemah', 'jual', 'pesimis'];
    const bullishCount = bullishWords.filter(w => lowerText.includes(w)).length;
    const bearishCount = bearishWords.filter(w => lowerText.includes(w)).length;
    if (bullishCount > bearishCount) MarketAI = 'bullish';
    else if (bearishCount > bullishCount) MarketAI = 'bearish';

    res.status(200).json({ text, MarketAI });
  } catch (error) {
    console.error('[Chat Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Analyze a specific news headline
app.post('/api/analyze', async (req, res) => {
  const { headline, watchlist = [] } = req.body;

  if (!headline) {
    return res.status(400).json({ error: 'headline diperlukan' });
  }

  try {
    const prompt = `Analisis MarketAI berita berikut untuk pasar keuangan Indonesia:
    
"${headline}"

${watchlist.length > 0 ? `Watchlist pengguna: ${watchlist.join(', ')}` : ''}

Berikan analisis dalam format:
- MarketAI: [Bullish/Bearish/Netral] 
- SKOR: [0-100]
- DAMPAK: [dampak per aset]
- REKOMENDASI: [aksi singkat]`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.6,
        maxOutputTokens: 512,
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    res.status(200).json({ text: response.text, headline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Market MarketAI AI Server running on http://localhost:${PORT}`);
  console.log(`📊 Model: ${GEMINI_MODEL}`);
});
