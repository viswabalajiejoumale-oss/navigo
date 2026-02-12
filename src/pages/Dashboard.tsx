import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TRANSPORT_MODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import EmergencyButton from "@/components/EmergencyButton";
import {
  Bus,
  Plane,
  Train,
  Car,
  TrainFront,
  Accessibility,
  Wallet,
  Settings,
  User,
  Moon,
  Sun,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Bus,
  Plane,
  Train,
  Car,
  TrainFront,
};

const transportThemeClass: Record<string, string> = {
  bus: "bg-gradient-to-br from-transport-bus to-transport-bus/80 text-white",
  airport: "bg-gradient-to-br from-transport-airport to-transport-airport/80 text-white",
  railway: "bg-gradient-to-br from-transport-railway to-transport-railway/80 text-white",
  taxi: "bg-gradient-to-br from-transport-taxi to-transport-taxi/80 text-white",
  metro: "bg-gradient-to-br from-transport-metro to-transport-metro/80 text-white",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { state, dispatch, triggerHaptic } = useApp();

  const handleModeSelect = (modeId: string) => {
    dispatch({ type: "SET_TRANSPORT_MODE", payload: modeId });
    triggerHaptic([50]);
    const mode = TRANSPORT_MODES.find((m) => m.id === modeId);
    if (mode) {
      console.log(`${mode.name} selected`);
    }
    navigate(`/explore/${modeId}`);
  };

  const toggleHapticMode = () => {
    dispatch({ type: "TOGGLE_HAPTIC_MODE" });
    dispatch({ type: "TOGGLE_HIGH_CONTRAST" });
    triggerHaptic([100, 50, 100]);
    console.log(state.hapticMode ? "Haptic mode disabled" : "Haptic mode enabled");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl px-4 py-4 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-sm text-muted-foreground">
              Welcome back,
            </p>
            <h1 className="text-heading-3 font-bold">
              {state.userProfile?.name || "Traveler"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Accessibility toggle */}
            <Button
              variant={state.hapticMode ? "default" : "outline"}
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={toggleHapticMode}
            >
              <Accessibility className="h-5 w-5" />
            </Button>
            
            {/* Dark mode toggle */}
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={() => dispatch({ type: "TOGGLE_DARK_MODE" })}
            >
              {state.darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
        {/* Accessibility mode banner */}
        {state.hapticMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 rounded-xl bg-primary/10 border-2 border-primary p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Accessibility className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-label font-semibold">Haptic Mode Active</h3>
                <p className="text-body-sm text-muted-foreground">
                  High contrast & vibration navigation enabled
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section title */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-heading-2 font-bold">Choose Transport</h2>
          <p className="text-body-md text-muted-foreground">
            Select your preferred mode of travel
          </p>
        </motion.div>

        {/* Transport mode cards */}
        <motion.div
          className="grid gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {TRANSPORT_MODES.map((mode) => {
            const IconComponent = iconMap[mode.icon];
            const themeClass = transportThemeClass[mode.id] || "bg-foreground text-background";
            return (
              <motion.button
                key={mode.id}
                variants={item}
                onClick={() => handleModeSelect(mode.id)}
                className={`transport-card ${themeClass} touch-target focus-ring text-left`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-heading-3 font-bold text-white">
                      {mode.name}
                    </h3>
                    <p className="text-body-sm text-white/80">
                      {mode.description}
                    </p>
                  </div>
                  <motion.div
                    className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                  >
                    <span className="text-white text-xl">→</span>
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          className="mt-8 grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-xl"
            onClick={() => navigate("/expenses")}
          >
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-body-sm">Expenses</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-xl"
            onClick={() => navigate("/ambulance")}
          >
            <User className="h-6 w-6 text-destructive" />
            <span className="text-body-sm">Ambulance</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-xl"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-6 w-6 text-muted-foreground" />
            <span className="text-body-sm">Settings</span>
          </Button>
        </motion.div>
      </main>

      {/* Emergency button */}
      <EmergencyButton />
      
    </div>
  );
};

export default Dashboard;
