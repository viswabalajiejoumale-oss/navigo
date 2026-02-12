import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader, Volume2, VolumeX, MessageCircle, X, Mic, MicOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";


export default function ChatBox() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "नमस्ते! मैं Navigo AI Assistant हूँ। मैं आपकी यात्रा में आपकी मदद कर सकता हूँ। क्या मैं आपकी सहायता कर सकता हूँ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceMode, setVoiceMode] = useState<"browser" | "external">("browser");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { listening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceNavigation();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!listening || !transcript) return;
    setInput(transcript);
  }, [listening, transcript]);

  const stopVoicePlayback = () => {
    try {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    } catch (e) {
      console.warn('Speech synthesis cleanup warning:', e);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      stopVoicePlayback();
    };
  }, [state.language]);

  const getLanguageCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      es: 'es-ES',
      fr: 'fr-FR',
    };
    return langMap[lang] || 'en-US';
  };

  const speakWithBrowser = (text: string) => {
    if (!synthRef.current) return;
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(state.language);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  const playExternalTts = async (text: string) => {
    try {
      const resp = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: state.language }),
      });

      if (!resp.ok) {
        return false;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
      };

      await audio.play();
      return true;
    } catch (error) {
      console.warn('External TTS failed, falling back to browser:', error);
      return false;
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    stopVoicePlayback();

    if (voiceMode === 'external') {
      const played = await playExternalTts(text);
      if (played) return;
    }

    speakWithBrowser(text);
  };

  const parseActions = (text: string) => {
    const actions: string[] = [];
    const actionPattern = /\[ACTION:([A-Z_]+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = actionPattern.exec(text)) !== null) {
      actions.push(match[1]);
    }

    const cleanedText = text
      .replace(actionPattern, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return { cleanedText, actions };
  };

  const handleActions = (actions: string[]) => {
    if (!actions.length) return;

    actions.forEach((action) => {
      switch (action) {
        case "OPEN_MAP": {
          const modeId = state.currentTransportMode || "bus";
          if (!state.currentTransportMode) {
            dispatch({ type: "SET_TRANSPORT_MODE", payload: modeId });
          }
          navigate(`/explore/${modeId}`);
          break;
        }
        case "NAVIGATE_BUS": {
          dispatch({ type: "SET_TRANSPORT_MODE", payload: "bus" });
          navigate("/explore/bus");
          break;
        }
        case "NAVIGATE_TRAIN": {
          dispatch({ type: "SET_TRANSPORT_MODE", payload: "railway" });
          navigate("/explore/railway");
          break;
        }
        case "NAVIGATE_AIRPORT": {
          dispatch({ type: "SET_TRANSPORT_MODE", payload: "airport" });
          navigate("/explore/airport");
          break;
        }
        case "PLAY_TUTORIAL": {
          const modeId = state.currentTransportMode || "bus";
          if (!state.currentTransportMode) {
            dispatch({ type: "SET_TRANSPORT_MODE", payload: modeId });
          }
          navigate(`/tutorial/${modeId}`);
          break;
        }
        case "EMERGENCY": {
          navigate("/ambulance/user");
          break;
        }
        case "READ_SCREEN": {
          break;
        }
        default:
          break;
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare context data from app state
      const requestData = {
        text: input,
        language: state.language,
        userProfile: state.userProfile,
        currentTransportMode: state.currentTransportMode,
        expenses: state.expenses,
        appContext: {
          highContrast: state.highContrast,
          darkMode: state.darkMode,
          hapticMode: state.hapticMode,
        },
      };

      const response = await axios.post(`${API_URL}/assistant`, requestData);

      const serverResp = response.data?.response || "";
      const configured = response.data?.configured !== false;

      const assistantText = configured && serverResp
        ? serverResp
        : localAssistantResponse(input, state.language);

      const { cleanedText, actions } = parseActions(assistantText);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanedText || assistantText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      void speakText(assistantMessage.content);
      handleActions(actions);
    } catch (error) {
      console.error("Chat error:", error);
      const fallback = localAssistantResponse(input, state.language);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallback || "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      void speakText(errorMessage.content);
    } finally {
      setLoading(false);
    }
  };

  function localAssistantResponse(text: string, lang: string) {
    const q = text.toLowerCase();
    
    // Response mapping by language
    const responses: Record<string, Record<string, string>> = {
      hi: {
        greeting: "नमस्ते! आपकी यात्रा में मेरी मदद के लिए कुछ पूछिए। मैं रूट, ट्रैकिंग, खर्च या आपातकालीन सेवा के बारे में बता सकता हूँ।",
        emergency: "यह आपातकालीन है, तो कृपया ऐप में आपातकालीन बटन दबाएं या 112 कॉल करें।",
        location: "लाइव मैप खोलें और वाहन को ट्रैक करने के लिए 'Track Vehicle' चुनें।",
        cost: "किराया यात्रा के तरीके पर निर्भर करता है। विस्तृत अनुमान के लिए Route Planner का उपयोग करें।",
        thanks: "आपका स्वागत है! मैं आपकी और मदद के लिए यहाँ हूँ।",
      },
      en: {
        greeting: "Hello! I'm Navigo AI Assistant. Ask me about routes, tracking, expenses, or emergencies.",
        emergency: "For emergencies, please tap the Emergency button in the app or call 112.",
        location: "Open the Live Map and select 'Track Vehicle' to see nearby transportation.",
        cost: "Fares vary by transport mode. Use Route Planner for detailed estimates.",
        thanks: "You're welcome—glad to help!",
      },
      bn: {
        greeting: "হ্যালো! আমি Navigo AI সহায়ক। রুট, ট্র্যাকিং, খরচ সম্পর্কে আমাকে জিজ্ঞাসা করুন।",
        emergency: "জরুরি অবস্থায়, অ্যাপটি জরুরি বোতাম টগল করুন বা 112 কল করুন।",
        location: "লাইভ ম্যাপ খুলুন এবং যানবাহন ট্র্যাক করতে বেছে নিন।",
        cost: "ভাড়া পরিবহনের মোডের উপর নির্ভর করে। বিস্তারিত অনুমানের জন্য রুট প্ল্যানার ব্যবহার করুন।",
        thanks: "স্বাগতম—সাহায্য করতে পেরে আনন্দিত।",
      },
      ta: {
        greeting: "வணக்கம்! நான் Navigo AI உதவியாளர். பாதைகள், பதிவுபடுத்தல், செலவு பற்றி கேளுங்கள்.",
        emergency: "அவசரநிலையில், ஆப்பில் জরூரி பொத்தானைத் தட்டவும் அல்லது 112க்கு அழைக்கவும்.",
        location: "நேரடி வரைபடத்தைத் திறந்து வாகனத்தைப் பதிவுபடுத்த 'Track Vehicle' தேர்ந்தெடுக்கவும்.",
        cost: "கட்டணம் போக்குவரத்து பயன்முறையைப் பொறுத்தது. விரிவான மதிப்பிடுகளுக்கு Route Planner பயன்படுத்தவும்.",
        thanks: "நன்றி—உதவ முடிந்ததில் மகிழ்ச்சி।",
      },
      es: {
        greeting: "¡Hola! Soy el asistente de IA de Navigo. Pregúntame sobre rutas, seguimiento o costos.",
        emergency: "En caso de emergencia, toque el botón de emergencia en la aplicación o llame al 112.",
        location: "Abra el mapa en vivo y seleccione 'Track Vehicle' para ver el transporte cercano.",
        cost: "Las tarifas varían según el modo de transporte. Use Route Planner para estimaciones detalladas.",
        thanks: "¡De nada! Estoy aquí para ayudarte.",
      },
      fr: {
        greeting: "Bonjour! Je suis l'assistant IA de Navigo. Posez-moi des questions sur les itinéraires, le suivi ou les coûts.",
        emergency: "En cas d'urgence, appuyez sur le bouton d'urgence dans l'application ou appelez le 112.",
        location: "Ouvrez la carte en direct et sélectionnez 'Track Vehicle' pour voir les transports à proximité.",
        cost: "Les tarifs varient selon le mode de transport. Utilisez Route Planner pour des estimations détaillées.",
        thanks: "De rien—heureux d'aider!",
      },
    };

    const langResponses = responses[lang] || responses.en;

    if (/hello|hi|hey|नमस्ते|assalamu|bonjour|hola/.test(q)) return langResponses.greeting;
    if (/emergenc|ambulance|help|आपात|urgence|emergencia/.test(q)) return langResponses.emergency;
    if (/where|location|bus|train|कहाँ|localisation|dónde/.test(q)) return langResponses.location;
    if (/cost|price|fare|खर्च|prix|tarifa/.test(q)) return langResponses.cost;
    if (/thanks|thank you|धन्यवाद|merci|gracias/.test(q)) return langResponses.thanks;

    return langResponses.greeting;
  }

  return (
    <>
      {/* Floating AI Assistant Button */}
      <motion.button
        className="fixed bottom-32 right-4 z-40 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl transition-shadow"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Navigo AI Assistant"
        title="Chat with Navigo AI"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] bg-background rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Navigo AI Assistant</h3>
                  <p className="text-sm text-blue-100">Your travel companion</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="p-2 rounded-lg hover:bg-white/20 transition"
                    title={voiceEnabled ? "Disable voice" : "Enable voice"}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setVoiceMode((prev) => (prev === "browser" ? "external" : "browser"))}
                    className="px-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 transition"
                    title={voiceMode === "browser" ? "Browser voice" : "External voice"}
                  >
                    {voiceMode === "browser" ? "Browser" : "External"}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/20 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-xs ${
                          msg.role === "user"
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      key="loading-indicator"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-lg p-3 rounded-bl-none">
                        <Loader className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 bg-background">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder={t("Ask about your travel...")}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    disabled={loading}
                  />
                  {browserSupportsSpeechRecognition && (
                    <button
                      onClick={() => (listening ? stopListening() : startListening())}
                      className={`rounded-lg border border-border px-3 py-2 text-sm transition ${
                        listening ? "bg-red-500 text-white border-red-500" : "bg-background text-foreground"
                      }`}
                      title={listening ? "Stop listening" : "Start voice input"}
                      disabled={loading}
                    >
                      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-blue-500 text-white p-2 hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
