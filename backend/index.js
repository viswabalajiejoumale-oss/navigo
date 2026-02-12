import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const OPENROUTER_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-pro-1.5';
const OPENROUTER_VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'openai/gpt-4o';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    if (!roomId) return;
    const roomName = `room_${roomId}`;
    socket.join(roomName);
  });

  socket.on('telemetry_update', (payload) => {
    if (!payload?.roomId) return;
    const roomName = `room_${payload.roomId}`;
    io.to(roomName).emit('telemetry_received', payload);
  });
});

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

  try {
    const response = await axios.post(OPENROUTER_URL, payload, { headers, timeout: 20000 });
    const content = response.data?.choices?.[0]?.message?.content || '';
    return { configured: true, content };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      const err = new Error('OpenRouter unauthorized');
      err.status = 401;
      throw err;
    }
    throw error;
  }
}

async function callOpenRouterVision({ imageBase64 }) {
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
    model: OPENROUTER_VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'You are a helpful travel assistant. Analyze this ticket image and provide a clear, natural explanation. Include: 1) Origin and destination, 2) Travel date and time, 3) Transport type (bus/train/flight/metro), 4) Platform or gate number if visible, 5) Whether the ticket is expired or still valid based on the departure date/time shown. Be concise and helpful.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    temperature: 0.3,
    max_tokens: 300
  };

  try {
    const response = await axios.post(OPENROUTER_URL, payload, { headers, timeout: 20000 });
    const content = response.data?.choices?.[0]?.message?.content || '';
    return { configured: true, content };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      const err = new Error('OpenRouter unauthorized');
      err.status = 401;
      throw err;
    }
    if (error?.response?.data) {
      console.error('❌ OpenRouter vision error detail:', error.response.data);
    }
    throw error;
  }
}

const barrierReports = [];
const ambulanceAdmins = [
  {
    id: '1',
    ownerName: 'Pondy Emergency Services',
    licenseNumber: 'TN-PY-EM-001',
    ambulanceNumber: 'PY-01-AMB-1001',
    vehicleType: 'Advanced Life Support',
    contact: '+91-98765-00001',
    available: true
  },
  {
    id: '2',
    ownerName: 'Chennai Rapid Care',
    licenseNumber: 'TN-CH-EM-014',
    ambulanceNumber: 'TN-09-AMB-2214',
    vehicleType: 'Basic Life Support',
    contact: '+91-98765-00002',
    available: true
  },
  {
    id: '3',
    ownerName: 'Coimbatore MedAssist',
    licenseNumber: 'TN-CO-EM-203',
    ambulanceNumber: 'TN-33-AMB-3203',
    vehicleType: 'Neonatal',
    contact: '+91-98765-00003',
    available: false
  }
];

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

app.get('/ambulances', (req, res) => {
  return res.json(ambulanceAdmins);
});

app.post('/ambulances', (req, res) => {
  const payload = req.body || {};
  const requiredFields = ['ownerName', 'licenseNumber', 'ambulanceNumber', 'vehicleType', 'contact'];
  const missing = requiredFields.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const newAdmin = {
    id: String(Date.now()),
    ownerName: String(payload.ownerName),
    licenseNumber: String(payload.licenseNumber),
    ambulanceNumber: String(payload.ambulanceNumber),
    vehicleType: String(payload.vehicleType),
    contact: String(payload.contact),
    available: Boolean(payload.available ?? true)
  };

  ambulanceAdmins.push(newAdmin);
  return res.status(201).json(newAdmin);
});

app.patch('/ambulances/:id', (req, res) => {
  const { id } = req.params;
  const { available } = req.body || {};
  const target = ambulanceAdmins.find((admin) => admin.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Ambulance not found' });
  }

  if (typeof available !== 'boolean') {
    return res.status(400).json({ error: 'available must be a boolean' });
  }

  target.available = available;
  return res.json(target);
});

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
      if (error?.status === 401) {
        return res.status(401).json({ error: 'OpenRouter unauthorized' });
      }
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

app.post('/api/scan-ticket', async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const sanitized = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    let result;
    try {
      result = await callOpenRouterVision({ imageBase64: sanitized });
    } catch (error) {
      if (error?.status === 401) {
        return res.status(401).json({ error: 'OpenRouter unauthorized' });
      }
      console.error('❌ Ticket scan error:', error.message);
      if (error?.response?.data) {
        console.error('❌ Ticket scan error detail:', error.response.data);
      }
      return res.status(500).json({ error: 'Ticket scan failed' });
    }

    if (!result.configured) {
      return res.status(501).json({ error: 'OpenRouter not configured', configured: false });
    }

    return res.json({ raw: result.content });
  } catch (error) {
    console.error('❌ Ticket scan error:', error.message);
    return res.status(500).json({ error: 'Ticket scan failed' });
  }
});

app.post('/api/barriers', async (req, res) => {
  const { lat, lng, type } = req.body || {};
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) {
    return res.status(400).json({ error: 'lat, lng, and type are required' });
  }

  const report = {
    id: String(Date.now()),
    location_lat: lat,
    location_lng: lng,
    issue_type: String(type),
    status: 'open'
  };
  barrierReports.push(report);
  return res.json(report);
});

app.get('/api/barriers', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 500);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const nearby = barrierReports.filter((report) => {
    const distance = haversineMeters(lat, lng, report.location_lat, report.location_lng);
    return distance <= radius;
  });

  return res.json(nearby);
});

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

