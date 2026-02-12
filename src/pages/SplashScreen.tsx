import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SPLASH_DURATION, APP_NAME } from "@/lib/constants";
import { MapPin, Navigation } from "lucide-react";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const taglineTimer = setTimeout(() => setShowTagline(true), 800);
    const navigationTimer = setTimeout(() => {
      navigate("/language");
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Logo and branding */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Icon container */}
        <motion.div
          className="relative mb-8"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary">
            <Navigation className="h-16 w-16 text-primary-foreground" />
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <MapPin className="h-8 w-8 text-accent" />
            </motion.div>
          </div>
          
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-primary/50"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>

        {/* App name */}
        <motion.h1
          className="text-display-1 font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="text-gradient-primary">{APP_NAME}</span>
        </motion.h1>

        {/* Tagline */}
        <AnimatePresence>
          {showTagline && (
            <motion.p
              className="mt-4 text-body-lg text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              Navigate with confidence
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-16 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </motion.div>
    </div>
  );
};

export default SplashScreen;
