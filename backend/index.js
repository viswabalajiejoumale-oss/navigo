import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketServer } from "socket.io";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL ||
  "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemini-pro-1.5";
const OPENROUTER_VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL || "openai/gpt-4o";

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const activeCorridors = new Map();

io.on("connection", (socket) => {
  socket.on("join_room", (roomId) => {
    if (!roomId) return;
    const roomName = `room_${roomId}`;
    socket.join(roomName);
  });

  socket.on("telemetry_update", (payload) => {
    if (!payload?.roomId) return;
    const roomName = `room_${payload.roomId}`;
    io.to(roomName).emit("telemetry_received", payload);
  });

  socket.on("join_siren_zone", (zoneId) => {
    if (!zoneId) return;
    const zoneRoom = `siren_${zoneId}`;
    socket.join(zoneRoom);

    const corridor = activeCorridors.get(zoneId);
    if (corridor) {
      socket.emit("active_corridor_update", corridor);
    }
  });

  socket.on("virtual_siren_emit", (payload) => {
    if (!payload?.zoneId) return;
    const zoneRoom = `siren_${payload.zoneId}`;
    io.to(zoneRoom).emit("virtual_siren_alert", {
      zoneId: payload.zoneId,
      ambulanceId: payload.ambulanceId,
      etaMinutes: payload.etaMinutes ?? 3,
      position: payload.position || null,
      startedAt: new Date().toISOString(),
    });
  });

  socket.on("active_corridor_set", (payload) => {
    if (!payload?.zoneId) return;
    const nextState = {
      zoneId: payload.zoneId,
      active: Boolean(payload.active),
      phase: payload.phase || "green-wave",
      signalPriority: payload.signalPriority || "high",
      updatedAt: new Date().toISOString(),
    };
    activeCorridors.set(payload.zoneId, nextState);
    io.to(`siren_${payload.zoneId}`).emit("active_corridor_update", nextState);
  });

  socket.on("join_hospital_channel", (hospitalId) => {
    if (!hospitalId) return;
    socket.join(`hospital_${hospitalId}`);
  });

  socket.on("pre_arrival_note_emit", (payload) => {
    if (!payload?.ambulanceId || !payload?.hospitalId) return;
    const note = {
      id: String(Date.now()),
      ambulanceId: String(payload.ambulanceId),
      hospitalId: String(payload.hospitalId),
      patientName: String(payload.patientName || "Unknown"),
      bloodType: String(payload.bloodType || "Unknown"),
      allergies: String(payload.allergies || "None reported"),
      symptoms: String(payload.symptoms || "Not specified"),
      etaMinutes: Number(payload.etaMinutes || 10),
      createdAt: new Date().toISOString(),
    };

    preArrivalNotes.push(note);
    io.emit("pre_arrival_note_admin", note);
    io.to(`hospital_${note.hospitalId}`).emit(
      "pre_arrival_note_hospital",
      note,
    );
  });
});

function buildSystemPrompt({
  language,
  userProfile,
  transportMode,
  expenses,
  appContext,
}) {
  const safeProfile = userProfile || {};
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeContext = appContext || {};

  let prompt =
    "You are 'Navigo', an empathetic, highly intelligent voice assistant built into a transport application for disabled, elderly, and first-time travelers.\n\n";
  prompt += "CORE RULES:\n";
  prompt +=
    "1. Speak in extremely short, simple sentences. Max 2 sentences in speech.\n";
  prompt += "2. Never use technical jargon.\n";
  prompt += "3. Detect the user's language and reply in the same language.\n";
  prompt +=
    "4. Safety first: if user sounds lost, unsafe, scared, or in danger, choose EMERGENCY_SOS.\n\n";
  prompt += "AVAILABLE action_key values:\n";
  prompt += "- Maps_TO (payload must include destination and mode)\n";
  prompt += "- OPEN_TICKET_LENS\n";
  prompt += "- ACTIVATE_GUARDIAN\n";
  prompt += "- ENABLE_COMPASS\n";
  prompt += "- REPORT_BARRIER\n";
  prompt += "- READ_SCREEN\n";
  prompt += "- EMERGENCY_SOS\n";
  prompt += "- GENERAL_CHAT\n\n";
  prompt += "STRICT OUTPUT:\n";
  prompt +=
    "Return ONLY valid JSON object with keys: speech, action_key, payload. No markdown, no explanation, no extra text.\n";
  prompt +=
    "payload must be an object. For actions without required data, return empty object {}.\n\n";

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
    prompt += "- Accessibility: Dark mode enabled\n";
  }
  if (safeContext.highContrast) {
    prompt += "- Accessibility: High contrast enabled\n";
  }

  prompt +=
    "\nREMEMBER: return one JSON object only, keep speech short and comforting, and prioritize safety.\n";

  return prompt;
}

function normalizeLanguageCode(language) {
  const raw = String(language || "en").toLowerCase();
  if (!raw) return "en";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("hi")) return "hi";
  if (raw.startsWith("ta")) return "ta";
  if (raw.startsWith("te")) return "te";
  if (raw.startsWith("bn")) return "bn";
  if (raw.startsWith("mr")) return "mr";
  if (raw.startsWith("gu")) return "gu";
  if (raw.startsWith("kn")) return "kn";
  if (raw.startsWith("ml")) return "ml";
  if (raw.startsWith("pa")) return "pa";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("fr")) return "fr";
  return "en";
}

function detectLanguageFromText(text, languageHint) {
  const hinted = normalizeLanguageCode(languageHint);
  if (hinted !== "en") return hinted;

  const input = String(text || "");
  if (/[\u0900-\u097F]/.test(input)) return "hi";
  if (/[\u0980-\u09FF]/.test(input)) return "bn";
  if (/[\u0A80-\u0AFF]/.test(input)) return "gu";
  if (/[\u0A00-\u0A7F]/.test(input)) return "pa";
  if (/[\u0B80-\u0BFF]/.test(input)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(input)) return "te";
  if (/[\u0C80-\u0CFF]/.test(input)) return "kn";
  if (/[\u0D00-\u0D7F]/.test(input)) return "ml";
  if (/(hola|buenos|gracias|ayuda|donde)/i.test(input)) return "es";
  if (/(bonjour|merci|aide|où|gare)/i.test(input)) return "fr";
  return "en";
}

function inferMode(promptLower) {
  if (/(train|rail|railway|metro)/.test(promptLower)) return "train";
  if (/(airport|flight|plane)/.test(promptLower)) return "airport";
  if (/(taxi|cab)/.test(promptLower)) return "taxi";
  return "bus";
}

function inferDestination(prompt) {
  const text = String(prompt || "");
  const byPattern =
    /(?:to|towards|for|hasta|vers|कलिए|के लिए)\s+([a-zA-Z\u00C0-\u024F\u0900-\u0D7F0-9\s-]{2,60})/i;
  const match = text.match(byPattern);
  const destination = match?.[1]?.trim();
  if (destination && destination.length > 1) {
    return destination.replace(/\b(by|using|via)\b.*$/i, "").trim();
  }
  return "nearest stop";
}

function getLocalizedSpeech(language, actionKey, destination) {
  const lines = {
    en: {
      Maps_TO: `I am taking you to ${destination}. Follow me.`,
      OPEN_TICKET_LENS: "Please show your ticket. I am opening the scanner.",
      ACTIVATE_GUARDIAN: "I am sharing your location now. Your family can see you.",
      ENABLE_COMPASS: "Compass is on. I will guide you step by step.",
      REPORT_BARRIER: "I have reported the blocked path. Thank you for sharing.",
      READ_SCREEN: "I am reading the screen now. Please listen.",
      EMERGENCY_SOS: "You are not alone. I am calling emergency help now.",
      GENERAL_CHAT: "I am here with you. Tell me what you need.",
    },
    hi: {
      Maps_TO: `${destination} के लिए रास्ता खोल रहा हूँ। मेरे साथ चलिए।`,
      OPEN_TICKET_LENS: "अपना टिकट दिखाइए। मैं स्कैनर खोल रहा हूँ।",
      ACTIVATE_GUARDIAN: "मैं आपकी लोकेशन अभी साझा कर रहा हूँ। परिवार आपको देख सकेगा।",
      ENABLE_COMPASS: "कंपास चालू है। मैं कदम-कदम पर मार्गदर्शन दूँगा।",
      REPORT_BARRIER: "रुका हुआ रास्ता रिपोर्ट कर दिया है। बताने के लिए धन्यवाद।",
      READ_SCREEN: "मैं स्क्रीन अभी पढ़ रहा हूँ। कृपया सुनिए।",
      EMERGENCY_SOS: "आप अकेले नहीं हैं। मैं अभी मदद बुला रहा हूँ।",
      GENERAL_CHAT: "मैं आपके साथ हूँ। बताइए क्या चाहिए।",
    },
    es: {
      Maps_TO: `Te llevo a ${destination}. Sígueme.`,
      OPEN_TICKET_LENS: "Muestra tu boleto. Abro el escáner.",
      ACTIVATE_GUARDIAN: "Estoy compartiendo tu ubicación ahora. Tu familia puede verte.",
      ENABLE_COMPASS: "Brújula activada. Te guiaré paso a paso.",
      REPORT_BARRIER: "Ya reporté el camino bloqueado. Gracias.",
      READ_SCREEN: "Estoy leyendo la pantalla ahora. Escucha.",
      EMERGENCY_SOS: "No estás solo. Estoy pidiendo ayuda ahora.",
      GENERAL_CHAT: "Estoy contigo. Dime qué necesitas.",
    },
    fr: {
      Maps_TO: `Je t’emmène vers ${destination}. Suis-moi.`,
      OPEN_TICKET_LENS: "Montre ton billet. J’ouvre le scanner.",
      ACTIVATE_GUARDIAN: "Je partage ta position maintenant. Ta famille peut te voir.",
      ENABLE_COMPASS: "Boussole activée. Je te guide pas à pas.",
      REPORT_BARRIER: "J’ai signalé le passage bloqué. Merci.",
      READ_SCREEN: "Je lis l’écran maintenant. Écoute.",
      EMERGENCY_SOS: "Tu n’es pas seul. J’appelle les secours maintenant.",
      GENERAL_CHAT: "Je suis avec toi. Dis-moi ce qu’il faut.",
    },
  };

  const langPack = lines[language] || lines.en;
  return langPack[actionKey] || langPack.GENERAL_CHAT;
}

function mapActionFromText(prompt) {
  const promptLower = String(prompt || "").toLowerCase();

  if (
    /(help|sos|emergency|unsafe|danger|scared|lost|followed|panic|accident|attack|hurt|injured|save me)/.test(
      promptLower,
    )
  ) {
    return "EMERGENCY_SOS";
  }
  if (/(scan|ticket|qr|pass)/.test(promptLower)) {
    return "OPEN_TICKET_LENS";
  }
  if (/(family|guardian|share my location|live location|track me)/.test(promptLower)) {
    return "ACTIVATE_GUARDIAN";
  }
  if (/(blind|direction|platform|which way|guide me|compass)/.test(promptLower)) {
    return "ENABLE_COMPASS";
  }
  if (/(lift|elevator|broken|blocked|barrier|wheelchair|stairs blocked|path blocked)/.test(promptLower)) {
    return "REPORT_BARRIER";
  }
  if (/(read screen|what is on screen|read this|read aloud)/.test(promptLower)) {
    return "READ_SCREEN";
  }
  if (/(take me|go to|route to|navigate to|how to reach|directions to)/.test(promptLower)) {
    return "Maps_TO";
  }
  return "GENERAL_CHAT";
}

function composeNavigoIntent(prompt, languageHint) {
  const language = detectLanguageFromText(prompt, languageHint);
  const actionKey = mapActionFromText(prompt);
  const payload = {};

  if (actionKey === "Maps_TO") {
    payload.destination = inferDestination(prompt);
    payload.mode = inferMode(String(prompt || "").toLowerCase());
  }

  const speech = getLocalizedSpeech(language, actionKey, payload.destination || "your destination");

  return {
    speech,
    action_key: actionKey,
    payload,
  };
}

function parseNavigoIntent(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    const actionKey = String(parsed.action_key || "");
    const speech = String(parsed.speech || "").trim();
    const payload =
      parsed.payload && typeof parsed.payload === "object"
        ? parsed.payload
        : {};

    const validActionKeys = new Set([
      "Maps_TO",
      "OPEN_TICKET_LENS",
      "ACTIVATE_GUARDIAN",
      "ENABLE_COMPASS",
      "REPORT_BARRIER",
      "READ_SCREEN",
      "EMERGENCY_SOS",
      "GENERAL_CHAT",
    ]);

    if (!validActionKeys.has(actionKey) || !speech) return null;

    if (actionKey === "Maps_TO") {
      const destination = String(payload.destination || "").trim();
      const mode = String(payload.mode || "").trim();
      if (!destination || !mode) return null;
    }

    return {
      speech,
      action_key: actionKey,
      payload,
    };
  } catch {
    return null;
  }
}

async function callOpenRouter({ text, systemPrompt }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { configured: false, content: null };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
  }

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    temperature: 0.7,
    max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 300),
  };

  try {
    const response = await axios.post(OPENROUTER_URL, payload, {
      headers,
      timeout: 20000,
    });
    const content = response.data?.choices?.[0]?.message?.content || "";
    return { configured: true, content };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      const err = new Error("OpenRouter unauthorized");
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
    "Content-Type": "application/json",
  };
  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
  }

  const payload = {
    model: OPENROUTER_VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "You are a helpful travel assistant. Analyze this ticket image and provide a clear, natural explanation. Include: 1) Origin and destination, 2) Travel date and time, 3) Transport type (bus/train/flight/metro), 4) Platform or gate number if visible, 5) Whether the ticket is expired or still valid based on the departure date/time shown. Be concise and helpful.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 300,
  };

  try {
    const response = await axios.post(OPENROUTER_URL, payload, {
      headers,
      timeout: 20000,
    });
    const content = response.data?.choices?.[0]?.message?.content || "";
    return { configured: true, content };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      const err = new Error("OpenRouter unauthorized");
      err.status = 401;
      throw err;
    }
    if (error?.response?.data) {
      console.error("❌ OpenRouter vision error detail:", error.response.data);
    }
    throw error;
  }
}

const barrierReports = [];
const crowdDensityReports = [];
const roadHazardReports = [];
const preArrivalNotes = [];
const crowdFuelReports = [];
const ambulanceAdmins = [
  {
    id: "1",
    ownerName: "Pondy Emergency Services",
    licenseNumber: "TN-PY-EM-001",
    ambulanceNumber: "PY-01-AMB-1001",
    vehicleType: "Advanced Life Support",
    contact: "+91-98765-00001",
    available: true,
  },
  {
    id: "2",
    ownerName: "Chennai Rapid Care",
    licenseNumber: "TN-CH-EM-014",
    ambulanceNumber: "TN-09-AMB-2214",
    vehicleType: "Basic Life Support",
    contact: "+91-98765-00002",
    available: true,
  },
  {
    id: "3",
    ownerName: "Coimbatore MedAssist",
    licenseNumber: "TN-CO-EM-203",
    ambulanceNumber: "TN-33-AMB-3203",
    vehicleType: "Neonatal",
    contact: "+91-98765-00003",
    available: false,
  },
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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function mapVoiceRssLanguage(language) {
  const map = {
    en: "en-us",
    hi: "hi-in",
    ta: "ta-in",
    te: "te-in",
    bn: "bn-in",
    mr: "mr-in",
    gu: "gu-in",
    kn: "kn-in",
    ml: "ml-in",
    pa: "pa-in",
    es: "es-es",
    fr: "fr-fr",
  };
  return map[language] || "en-us";
}

function summarizeCrowdDensity(items) {
  const counts = {
    plenty_seats: 0,
    standing_only: 0,
    full: 0,
  };

  for (const item of items) {
    if (counts[item.level] !== undefined) {
      counts[item.level] += 1;
    }
  }

  const dominant =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "plenty_seats";

  return {
    counts,
    dominant,
    totalReports: items.length,
  };
}

app.get("/ambulances", (req, res) => {
  return res.json(ambulanceAdmins);
});

app.post("/ambulances", (req, res) => {
  const payload = req.body || {};
  const requiredFields = [
    "ownerName",
    "licenseNumber",
    "ambulanceNumber",
    "vehicleType",
    "contact",
  ];
  const missing = requiredFields.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return res
      .status(400)
      .json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  const newAdmin = {
    id: String(Date.now()),
    ownerName: String(payload.ownerName),
    licenseNumber: String(payload.licenseNumber),
    ambulanceNumber: String(payload.ambulanceNumber),
    vehicleType: String(payload.vehicleType),
    contact: String(payload.contact),
    available: Boolean(payload.available ?? true),
  };

  ambulanceAdmins.push(newAdmin);
  return res.status(201).json(newAdmin);
});

app.patch("/ambulances/:id", (req, res) => {
  const { id } = req.params;
  const { available } = req.body || {};
  const target = ambulanceAdmins.find((admin) => admin.id === id);
  if (!target) {
    return res.status(404).json({ error: "Ambulance not found" });
  }

  if (typeof available !== "boolean") {
    return res.status(400).json({ error: "available must be a boolean" });
  }

  target.available = available;
  return res.json(target);
});

app.post("/assistant", async (req, res) => {
  try {
    const {
      text,
      language,
      userProfile,
      currentTransportMode,
      expenses,
      appContext,
    } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    const sanitizedText = text.trim().substring(0, 1000);
    const sanitizedLanguage = (language || "en").substring(0, 10);
    console.log(
      `📨 Assistant request: "${sanitizedText}" | Language: ${sanitizedLanguage}`,
    );

    const systemPrompt = buildSystemPrompt({
      language: sanitizedLanguage,
      userProfile,
      transportMode: currentTransportMode,
      expenses,
      appContext,
    });

    let result;
    try {
      result = await callOpenRouter({ text: sanitizedText, systemPrompt });
    } catch (error) {
      if (error?.status === 401) {
        return res.status(401).json({ error: "OpenRouter unauthorized" });
      }
      console.error("❌ OpenRouter error:", error.message);
      result = { configured: true, content: null };
    }

    if (!result.configured) {
      return res.status(501).json({
        error: "OpenRouter not configured",
        configured: false,
      });
    }

    const rawContent = result.content?.trim() || "";
    const parsedIntent = parseNavigoIntent(rawContent);
    const fallbackIntent = composeNavigoIntent(
      sanitizedText,
      sanitizedLanguage,
    );
    const intent = parsedIntent || fallbackIntent;

    console.log(
      `✅ Action: "${intent.action_key}" | Speech: "${intent.speech.substring(0, 80)}..."`,
    );

    return res.json({
      response: intent.speech,
      intent,
      configured: true,
      fallback: !parsedIntent,
    });
  } catch (error) {
    console.error("❌ Assistant error:", error.message);
    const fallback = composeNavigoIntent(req?.body?.text, req?.body?.language);
    res.status(200).json({
      response: fallback.speech,
      intent: fallback,
      configured: false,
      fallback: true,
    });
  }
});

app.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    const provider = String(process.env.TTS_PROVIDER || "").toLowerCase();
    const apiKey = process.env.VOICERSS_API_KEY;
    if (provider !== "voicerss" || !apiKey) {
      return res.status(501).json({ error: "External TTS not configured" });
    }

    const voiceLang = mapVoiceRssLanguage(language || "en");
    const ttsResponse = await axios.get("https://api.voicerss.org/", {
      params: {
        key: apiKey,
        hl: voiceLang,
        src: text,
        c: "MP3",
        f: "44khz_16bit_stereo",
      },
      responseType: "arraybuffer",
      timeout: 20000,
    });

    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(Buffer.from(ttsResponse.data));
  } catch (error) {
    console.error("❌ TTS error:", error.message);
    return res.status(500).json({ error: "Failed to generate speech" });
  }
});

app.post("/api/scan-ticket", async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const sanitized = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    let result;
    try {
      result = await callOpenRouterVision({ imageBase64: sanitized });
    } catch (error) {
      if (error?.status === 401) {
        return res.status(401).json({ error: "OpenRouter unauthorized" });
      }
      console.error("❌ Ticket scan error:", error.message);
      if (error?.response?.data) {
        console.error("❌ Ticket scan error detail:", error.response.data);
      }
      return res.status(500).json({ error: "Ticket scan failed" });
    }

    if (!result.configured) {
      return res
        .status(501)
        .json({ error: "OpenRouter not configured", configured: false });
    }

    return res.json({ raw: result.content });
  } catch (error) {
    console.error("❌ Ticket scan error:", error.message);
    return res.status(500).json({ error: "Ticket scan failed" });
  }
});

app.post("/api/scan-signage", async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const sanitized = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    let result;
    try {
      result = await callOpenRouterVision({ imageBase64: sanitized });
    } catch (error) {
      if (error?.status === 401) {
        return res.status(401).json({ error: "OpenRouter unauthorized" });
      }
      console.error("❌ Signage scan error:", error.message);
      return res.status(500).json({ error: "Signage scan failed" });
    }

    if (!result.configured) {
      return res
        .status(501)
        .json({ error: "OpenRouter not configured", configured: false });
    }

    return res.json({ raw: result.content });
  } catch (error) {
    console.error("❌ Signage scan error:", error.message);
    return res.status(500).json({ error: "Signage scan failed" });
  }
});

app.post("/api/barriers", async (req, res) => {
  const { lat, lng, type } = req.body || {};
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) {
    return res.status(400).json({ error: "lat, lng, and type are required" });
  }

  const report = {
    id: String(Date.now()),
    location_lat: lat,
    location_lng: lng,
    issue_type: String(type),
    status: "open",
  };
  barrierReports.push(report);
  return res.json(report);
});

app.post("/api/crowd-density", async (req, res) => {
  const { routeId, mode, level, reporterId } = req.body || {};
  const normalizedLevel = String(level || "")
    .trim()
    .toLowerCase();
  const allowed = ["plenty_seats", "standing_only", "full"];

  if (!routeId || !mode || !allowed.includes(normalizedLevel)) {
    return res.status(400).json({
      error:
        "routeId, mode and level are required. level must be one of plenty_seats, standing_only, full",
    });
  }

  const report = {
    id: String(Date.now()),
    routeId: String(routeId),
    mode: String(mode),
    level: normalizedLevel,
    reporterId: String(reporterId || "anonymous"),
    createdAt: new Date().toISOString(),
  };

  crowdDensityReports.push(report);

  const latestWindow = crowdDensityReports
    .filter(
      (item) => item.routeId === report.routeId && item.mode === report.mode,
    )
    .slice(-100);
  const summary = summarizeCrowdDensity(latestWindow);

  io.emit("crowd_density_update", {
    routeId: report.routeId,
    mode: report.mode,
    ...summary,
    updatedAt: new Date().toISOString(),
  });

  return res.json({ report, summary });
});

app.get("/api/crowd-density", async (req, res) => {
  const routeId = String(req.query.routeId || "").trim();
  const mode = String(req.query.mode || "").trim();
  if (!routeId || !mode) {
    return res.status(400).json({ error: "routeId and mode are required" });
  }

  const latestWindow = crowdDensityReports
    .filter((item) => item.routeId === routeId && item.mode === mode)
    .slice(-100);

  const summary = summarizeCrowdDensity(latestWindow);
  return res.json({
    routeId,
    mode,
    ...summary,
    updatedAt: new Date().toISOString(),
  });
});

app.post("/api/road-hazards", async (req, res) => {
  const { lat, lng, type, source } = req.body || {};
  const hazardType = String(type || "")
    .trim()
    .toLowerCase();
  const allowed = ["pothole", "broken_streetlight", "sidewalk_obstruction"];

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !allowed.includes(hazardType)
  ) {
    return res.status(400).json({
      error:
        "lat, lng and type are required. type must be pothole, broken_streetlight or sidewalk_obstruction",
    });
  }

  const report = {
    id: String(Date.now()),
    lat,
    lng,
    type: hazardType,
    source: String(source || "manual"),
    createdAt: new Date().toISOString(),
    status: "open",
  };

  roadHazardReports.push(report);
  io.emit("road_hazard_update", report);
  return res.status(201).json(report);
});

app.get("/api/road-hazards", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 1000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const nearby = roadHazardReports.filter((report) => {
    const distance = haversineMeters(lat, lng, report.lat, report.lng);
    return distance <= radius;
  });

  return res.json(nearby);
});

app.get("/api/barriers", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 500);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const nearby = barrierReports.filter((report) => {
    const distance = haversineMeters(
      lat,
      lng,
      report.location_lat,
      report.location_lng,
    );
    return distance <= radius;
  });

  return res.json(nearby);
});

app.post("/api/pre-arrival-notes", async (req, res) => {
  const {
    ambulanceId,
    hospitalId,
    patientName,
    bloodType,
    allergies,
    symptoms,
    etaMinutes,
  } = req.body || {};

  if (!ambulanceId || !hospitalId) {
    return res
      .status(400)
      .json({ error: "ambulanceId and hospitalId are required" });
  }

  const note = {
    id: String(Date.now()),
    ambulanceId: String(ambulanceId),
    hospitalId: String(hospitalId),
    patientName: String(patientName || "Unknown"),
    bloodType: String(bloodType || "Unknown"),
    allergies: String(allergies || "None reported"),
    symptoms: String(symptoms || "Not specified"),
    etaMinutes: Number(etaMinutes || 10),
    createdAt: new Date().toISOString(),
  };

  preArrivalNotes.push(note);
  io.emit("pre_arrival_note_admin", note);
  io.to(`hospital_${note.hospitalId}`).emit("pre_arrival_note_hospital", note);

  return res.status(201).json(note);
});

app.get("/api/pre-arrival-notes", async (req, res) => {
  const hospitalId = String(req.query.hospitalId || "").trim();
  const ambulanceId = String(req.query.ambulanceId || "").trim();

  let notes = [...preArrivalNotes];
  if (hospitalId)
    notes = notes.filter((item) => item.hospitalId === hospitalId);
  if (ambulanceId)
    notes = notes.filter((item) => item.ambulanceId === ambulanceId);

  return res.json(notes.slice(-50).reverse());
});

app.post("/api/fuel-prices/report", async (req, res) => {
  const { stop, price, source } = req.body || {};
  if (!stop || !Number.isFinite(price)) {
    return res
      .status(400)
      .json({ error: "stop and numeric price are required" });
  }

  const report = {
    id: String(Date.now()),
    stop: String(stop),
    price: Number(price),
    source: String(source || "crowd"),
    createdAt: new Date().toISOString(),
  };
  crowdFuelReports.push(report);
  return res.status(201).json(report);
});

app.get("/api/fuel-prices", async (req, res) => {
  const stop = String(req.query.stop || "").trim();
  if (!stop) {
    return res.status(400).json({ error: "stop is required" });
  }

  const base = 103 + (stop.length % 5);
  const apiSeries = Array.from({ length: 7 }, (_, idx) => {
    const drift = Math.sin(idx + stop.length) * 0.8;
    return Number((base + idx * 0.35 + drift).toFixed(2));
  });

  const crowdSeries = crowdFuelReports
    .filter((item) => item.stop.toLowerCase() === stop.toLowerCase())
    .slice(-7)
    .map((item) => item.price);

  const merged = apiSeries.map((value, idx) => {
    const crowd = crowdSeries[idx];
    return Number(
      (typeof crowd === "number" ? (crowd + value) / 2 : value).toFixed(2),
    );
  });

  const weeklyLow = Math.min(...merged);
  const latest = merged[merged.length - 1];

  return res.json({
    stop,
    source: "api+crowd",
    prices: merged,
    latest,
    weeklyLow,
    isWeeklyLowNow: latest <= weeklyLow + 0.2,
    updatedAt: new Date().toISOString(),
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
