import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Send,
  Sparkles,
  ArrowRight,
  User,
  Accessibility,
  Heart,
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "ai" | "user";
  content: string;
}

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    question: "Hello! 👋 I'm your Navigo AI assistant. I'm here to personalize your travel experience. What's your name?",
    field: "name",
    placeholder: "Enter your name",
  },
  {
    id: "age",
    question: "Nice to meet you, {name}! 🎉 To better assist you, could you tell me your age?",
    field: "age",
    placeholder: "Enter your age",
  },
  {
    id: "mobility",
    question: "Thank you! Do you have any mobility needs or accessibility requirements I should know about? (e.g., wheelchair, visual impairment, none)",
    field: "mobilityNeeds",
    placeholder: "Describe any mobility needs or type 'none'",
  },
  {
    id: "preferences",
    question: "Almost done! What are your travel preferences? (e.g., prefer trains over buses, need quiet environments, budget-conscious)",
    field: "preferences",
    placeholder: "Share your travel preferences",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    age: "",
    mobilityNeeds: "",
    preferences: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial AI message
  useEffect(() => {
    const timer = setTimeout(() => {
      addAIMessage(ONBOARDING_STEPS[0].question);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const addAIMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        content,
      };
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
    };
    setMessages((prev) => [...prev, userMessage]);

    const step = ONBOARDING_STEPS[currentStep];
    const updatedProfile = { ...userProfile, [step.field]: inputValue };
    setUserProfile(updatedProfile);
    setInputValue("");

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = ONBOARDING_STEPS[currentStep + 1];
      const nextQuestion = nextStep.question.replace("{name}", updatedProfile.name);
      
      setTimeout(() => {
        addAIMessage(nextQuestion);
        setCurrentStep((prev) => prev + 1);
      }, 500);
    } else {
      // Complete onboarding
      setTimeout(() => {
        addAIMessage(
          `Perfect, ${updatedProfile.name}! 🚀 Your profile is all set. I've personalized Navigo just for you. Let me show you around the app!`
        );
        setTimeout(() => {
          dispatch({ type: "SET_USER_PROFILE", payload: updatedProfile });
          dispatch({ type: "COMPLETE_ONBOARDING" });
          navigate("/dashboard");
        }, 2500);
      }, 500);
    }
  };

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <motion.header
        className="border-b bg-card px-4 py-4 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-label font-semibold">Navigo AI</h1>
              <p className="text-body-sm text-muted-foreground">Your travel companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.header>

      {/* Animated character area */}
      <div className="flex justify-center py-4 border-b bg-card/50">
        <motion.div
          className="relative"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {currentStep === 0 && <User className="h-12 w-12 text-primary" />}
              {currentStep === 1 && <Heart className="h-12 w-12 text-accent" />}
              {currentStep === 2 && <Accessibility className="h-12 w-12 text-primary" />}
              {currentStep === 3 && <Sparkles className="h-12 w-12 text-warning" />}
            </motion.div>
          </div>
          
          {/* Floating particles */}
          <motion.div
            className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-accent"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`chat-bubble ${
                  message.type === "ai" ? "chat-bubble-ai" : "chat-bubble-user"
                }`}
              >
                <p className="text-body-md">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="chat-bubble chat-bubble-ai flex items-center gap-1">
              <motion.div
                className="h-2 w-2 rounded-full bg-muted-foreground"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="h-2 w-2 rounded-full bg-muted-foreground"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="h-2 w-2 rounded-full bg-muted-foreground"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <motion.div
        className="border-t bg-card p-4 safe-area-bottom"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {currentStep < ONBOARDING_STEPS.length ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              {ONBOARDING_STEPS[currentStep].field === "mobilityNeeds" ||
              ONBOARDING_STEPS[currentStep].field === "preferences" ? (
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={ONBOARDING_STEPS[currentStep].placeholder}
                  className="min-h-[48px] resize-none pr-12"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              ) : (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={ONBOARDING_STEPS[currentStep].placeholder}
                  className="h-12 pr-12"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="h-12 w-12 rounded-xl bg-primary"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-12 gap-2"
          >
            Continue to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;
