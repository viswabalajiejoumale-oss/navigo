import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const OPENROUTER_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function buildSystemPrompt({ language, userProfile, transportMode, expenses, appContext }) {
  const safeProfile = userProfile || {};
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeContext = appContext || {};

  let prompt = "You are 'Navigo Assistant', an empathetic, intelligent, and accessible travel guide embedded in the 'Navigo' transport application.\n\n";
  prompt += "YOUR AUDIENCE:\n";
  prompt += "Your users are often first-time travelers, elderly people, or people with disabilities who may not be able to read well. They might be anxious or confused.\n\n";
  prompt += "YOUR CORE RULES:\n";
  prompt += "1. Tone: Be extremely patient, polite, and reassuring. Use simple, short sentences.\n";
  prompt += "2. Language: Reply in the same language as the user.\n";
  prompt += "3. No Jargon: Avoid technical terms. Use everyday words.\n";
  prompt += "4. Format: Prefer short bullet points the user can scan quickly.\n";
  prompt += "5. Brevity: Keep answers short unless the user asks for more detail.\n\n";
  prompt += "YOUR KNOWLEDGE BASE:\n";
  prompt += "- Bus: Platform numbers, bus numbers, live tracking.\n";
  prompt += "- Train: PNR status, coach position, station facilities.\n";
  prompt += "- Airport: Check-in counters, security gates, boarding passes.\n";
  prompt += "- Procedures: Explain how to buy a ticket or pass security step-by-step.\n\n";
  prompt += "FEATURE GUIDANCE:\n";
  prompt += "- When asked about distance, time, or expenses, provide a clear estimate and say what inputs you need if missing.\n";
  prompt += "- Proactively mention available travel modes (bus, railway, metro, taxi, airport) and suggest the best option.\n";
  prompt += "- Highlight helpful app features when relevant: live map, route planner, expense tracker, accessibility support, emergency help.\n\n";
  prompt += "AUTOMATION & ACTIONS (CRITICAL):\n";
  prompt += "If the user's intent is to perform an action inside the app, append a specific ACTION TAG at the end in square brackets like [ACTION:NAME].\n\n";
  prompt += "List of Action Tags:\n";
  prompt += "- [ACTION:NAVIGATE_BUS] -> If user asks to see buses.\n";
  prompt += "- [ACTION:NAVIGATE_TRAIN] -> If user asks to see trains.\n";
  prompt += "- [ACTION:NAVIGATE_AIRPORT] -> If user asks to see flights.\n";
  prompt += "- [ACTION:OPEN_MAP] -> If user asks 'Where am I?' or 'Track my bus'.\n";
  prompt += "- [ACTION:PLAY_TUTORIAL] -> If user asks 'How do I do this?' or 'Show me a video'.\n";
  prompt += "- [ACTION:EMERGENCY] -> If user says 'Help', 'SOS', or seems in danger.\n";
  prompt += "- [ACTION:READ_SCREEN] -> If user asks 'Read this to me'.\n\n";
  prompt += "CONTEXT INJECTION:\n";
  prompt += "Assume you have access to the user's current location and schedule. If the system provides data, incorporate it naturally.\n";
  prompt += "Return answers as short bullet points (2 to 6 bullets).\n\n";

  prompt += "CURRENT USER CONTEXT:\n";
  if (language) {
    prompt += `- Preferred Language: ${String(language).slice(0, 10)}\n`;
  }
  if (safeProfile.name) {
    prompt += `- User Name: ${safeProfile.name}\n`;
  }
  if (transportMode) {
    prompt += `- Current Transport Mode: ${transportMode}\n`;
  }
  if (safeExpenses.length > 0) {
    const total = safeExpenses.reduce((sum, expense) => {
      const value = Number(expense?.amount || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
    prompt += `- Total Travel Expenses: INR ${total.toFixed(2)}\n`;
    prompt += `- Number of Trips Logged: ${safeExpenses.length}\n`;
  }
  if (safeContext.darkMode) {
    prompt += '- Accessibility: Dark mode enabled\n';
  }
  if (safeContext.highContrast) {
    prompt += '- Accessibility: High contrast enabled\n';
  }

  prompt += "\nREMEMBER: Respond in the user's language. Be brief, kind, and include ACTION tags when appropriate.\n";

  return prompt;
}

function generateFallbackResponse(prompt) {
  const promptLower = String(prompt || '').toLowerCase();
  if (/(help|emergency|urgent|danger|sos|accident|unsafe|scared)/.test(promptLower)) {
    return 'I am activating Emergency Mode immediately. Staying with you. Please stay calm. [ACTION:EMERGENCY]';
  }
  if (/(lost|where am i|find me|location|track)/.test(promptLower)) {
    return "Don't worry. I am opening the live map now. Please look at the screen. [ACTION:OPEN_MAP]";
  }
  if (/(how to|how do i|show me|tutorial|teach|learn)/.test(promptLower)) {
    return 'I will show you a video guide. Please watch carefully. [ACTION:PLAY_TUTORIAL]';
  }
  if (/(bus|route|bus number|platform)/.test(promptLower)) {
    return 'Let me show you the bus information now. Opening bus tracker. [ACTION:NAVIGATE_BUS]';
  }
  if (/(train|railway|pnr|coach|station)/.test(promptLower)) {
    return 'I will show you train details now. Please wait. [ACTION:NAVIGATE_TRAIN]';
  }
  if (/(flight|airport|plane|boarding|check-in)/.test(promptLower)) {
    return 'Opening airport information for you now. [ACTION:NAVIGATE_AIRPORT]';
  }
  if (/(read|read this|read screen|speak)/.test(promptLower)) {
    return 'I will read the screen to you now. Please listen. [ACTION:READ_SCREEN]';
  }
  if (/(expense|cost|fare|money|spend|price|ticket price)/.test(promptLower)) {
    return 'I can help you track travel costs. Let me show you your expense history.';
  }
  if (/(route|direction|navigate|way|reach|go to|from|to)/.test(promptLower)) {
    return 'I can help you plan your route. Please tell me where you want to go. [ACTION:OPEN_MAP]';
  }
  if (/(hello|hi|hey|good morning|good evening|namaste)/.test(promptLower)) {
    return 'Hello! I am Navigo Assistant. I am here to help you travel safely and easily. What do you need?';
  }
  return 'I am here to help you. Please ask me about buses, trains, flights, or tickets. I will guide you.';
}

async function callOpenRouter({ text, systemPrompt }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { configured: false, content: null };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
  }

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    temperature: 0.7,
    max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 300)
  };

  const response = await axios.post(OPENROUTER_URL, payload, { headers, timeout: 20000 });
  const content = response.data?.choices?.[0]?.message?.content || '';
  return { configured: true, content };
}

function mapVoiceRssLanguage(language) {
  const map = {
    en: 'en-us',
    hi: 'hi-in',
    ta: 'ta-in',
    te: 'te-in',
    bn: 'bn-in',
    mr: 'mr-in',
    gu: 'gu-in',
    kn: 'kn-in',
    ml: 'ml-in',
    pa: 'pa-in',
    es: 'es-es',
    fr: 'fr-fr'
  };
  return map[language] || 'en-us';
}

app.post('/assistant', async (req, res) => {
  try {
    const { text, language, userProfile, currentTransportMode, expenses, appContext } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sanitizedText = text.trim().substring(0, 1000);
    const sanitizedLanguage = (language || 'en').substring(0, 10);
    console.log(`📨 Assistant request: "${sanitizedText}" | Language: ${sanitizedLanguage}`);

    const systemPrompt = buildSystemPrompt({
      language: sanitizedLanguage,
      userProfile,
      transportMode: currentTransportMode,
      expenses,
      appContext
    });

    let result;
    try {
      result = await callOpenRouter({ text: sanitizedText, systemPrompt });
    } catch (error) {
      console.error('❌ OpenRouter error:', error.message);
      result = { configured: true, content: null };
    }

    if (!result.configured) {
      return res.status(501).json({
        error: 'OpenRouter not configured',
        configured: false
      });
    }

    const responseText = result.content?.trim() || generateFallbackResponse(sanitizedText);
    console.log(`✅ Response: "${responseText.substring(0, 100)}..."`);
    return res.json({ response: responseText, configured: true });
  } catch (error) {
    console.error('❌ Assistant error:', error.message);
    const fallback = generateFallbackResponse(req?.body?.text);
    res.status(200).json({
      response: fallback,
      configured: false,
      fallback: true
    });
  }
});

app.post('/tts', async (req, res) => {
  try {
    const { text, language } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const provider = String(process.env.TTS_PROVIDER || '').toLowerCase();
    const apiKey = process.env.VOICERSS_API_KEY;
    if (provider !== 'voicerss' || !apiKey) {
      return res.status(501).json({ error: 'External TTS not configured' });
    }

    const voiceLang = mapVoiceRssLanguage(language || 'en');
    const ttsResponse = await axios.get('https://api.voicerss.org/', {
      params: {
        key: apiKey,
        hl: voiceLang,
        src: text,
        c: 'MP3',
        f: '44khz_16bit_stereo'
      },
      responseType: 'arraybuffer',
      timeout: 20000
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(ttsResponse.data));
  } catch (error) {
    console.error('❌ TTS error:', error.message);
    return res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

