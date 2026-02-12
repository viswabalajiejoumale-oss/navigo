import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LANGUAGES } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Check, Globe } from "lucide-react";

const LanguageSelection = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { t } = useTranslation();

  const handleLanguageSelect = (code: string) => {
    dispatch({ type: "SET_LANGUAGE", payload: code });
    const lang = LANGUAGES.find((l) => l.code === code);
    if (lang) {
      console.log(`Language set to ${lang.name}. Welcome to Navigo!`);
    }
    // Remove the translatePage call since we use static translations now
    setTimeout(() => navigate("/dashboard"), 500);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      <div className="container max-w-2xl py-8 px-4">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-heading-1 font-bold text-foreground">
            {t("Choose Your Language")}
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            {t("Select your preferred language for the app")}
          </p>
        </motion.div>

        {/* Language grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {LANGUAGES.map((lang) => (
            <motion.button
              key={lang.code}
              variants={item}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`language-card touch-target focus-ring relative ${
                state.language === lang.code ? "language-card-selected" : ""
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="text-label font-semibold text-foreground">
                {lang.nativeName}
              </span>
              <span className="text-body-sm text-muted-foreground">
                {lang.name}
              </span>
              <AnimatePresence mode="wait">
                {state.language === lang.code && (
                  <motion.div
                    key={`check-${lang.code}`}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </motion.div>

        {/* Continue hint */}
        <motion.p
          className="mt-8 text-center text-body-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Tap a language to continue
        </motion.p>
      </div>
    </div>
  );
};

export default LanguageSelection;
