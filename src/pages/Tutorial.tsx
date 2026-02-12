import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { TRANSPORT_MODES } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  RotateCcw,
} from "lucide-react";

const TUTORIALS: Record<string, Array<{ title: string; description: string; tip: string }>> = {
  bus: [
    { title: "Find Your Bus Stop", description: "Locate the nearest bus stop using the map. Look for the blue bus icon markers.", tip: "Most stops have a shelter and route information display." },
    { title: "Check the Schedule", description: "View real-time arrival times on the app or the display at the stop.", tip: "Buses may be delayed during peak hours." },
    { title: "Board the Bus", description: "Wait for passengers to exit first, then board through the front door.", tip: "Keep your ticket or pass ready for verification." },
    { title: "Find a Seat", description: "Priority seats are reserved for elderly, disabled, and pregnant passengers.", tip: "Hold the handrails if standing." },
    { title: "Signal Your Stop", description: "Press the stop button when approaching your destination.", tip: "Press the button at least 100m before your stop." },
  ],
  airport: [
    { title: "Check-in Online", description: "Complete web check-in 48-24 hours before your flight to save time.", tip: "Download your boarding pass to your phone." },
    { title: "Arrive Early", description: "Reach the airport 2-3 hours before domestic and 3-4 hours before international flights.", tip: "Check terminal number before leaving." },
    { title: "Security Check", description: "Remove laptops, liquids (in clear bags), and metal items before screening.", tip: "Wear easy-to-remove shoes." },
    { title: "Find Your Gate", description: "Check departure screens for your gate number and any updates.", tip: "Gates can change, so keep checking." },
    { title: "Boarding", description: "Listen for boarding announcements and have your ID and boarding pass ready.", tip: "Families with children usually board first." },
  ],
  railway: [
    { title: "Book Your Ticket", description: "Reserve your seat online or at the station counter in advance.", tip: "Tatkal booking opens 24 hours before departure." },
    { title: "Check PNR Status", description: "Verify your booking status before heading to the station.", tip: "Waitlisted tickets may not guarantee a seat." },
    { title: "Find Your Platform", description: "Check display boards for platform number and train arrival time.", tip: "Platform numbers can change at the last minute." },
    { title: "Board the Coach", description: "Find your coach number on the reservation chart displayed on the platform.", tip: "Board at the designated coach position." },
    { title: "Find Your Seat", description: "Locate your seat/berth number inside the coach.", tip: "Keep your ticket handy for TTE verification." },
  ],
  taxi: [
    { title: "Book Your Ride", description: "Enter your pickup and drop location in the app.", tip: "Share your trip with trusted contacts." },
    { title: "Verify the Driver", description: "Check driver photo, name, and vehicle number before getting in.", tip: "Never share OTP with the driver." },
    { title: "Track Your Ride", description: "Use live tracking to monitor your route.", tip: "Report if the driver deviates from the route." },
    { title: "Payment Options", description: "Pay via app, card, or cash as per your preference.", tip: "Rate your driver to help others." },
  ],
  metro: [
    { title: "Get Your Token/Card", description: "Purchase a token for single journey or get a metro card for regular travel.", tip: "Metro cards offer discounts on fares." },
    { title: "Security Check", description: "Place bags on the scanner and walk through the metal detector.", tip: "Keep prohibited items at home." },
    { title: "Find Your Platform", description: "Check direction boards and platform displays.", tip: "Stand behind the yellow line." },
    { title: "Board the Metro", description: "Let passengers exit first, then board quickly.", tip: "First coach is often reserved for women." },
    { title: "Exit at Your Station", description: "Listen for announcements and check displays for your stop.", tip: "Tap your card/token at the exit gate." },
  ],
};

const transportThemeClass: Record<string, string> = {
  bus: "bg-gradient-to-br from-transport-bus to-transport-bus/80 text-white",
  airport: "bg-gradient-to-br from-transport-airport to-transport-airport/80 text-white",
  railway: "bg-gradient-to-br from-transport-railway to-transport-railway/80 text-white",
  taxi: "bg-gradient-to-br from-transport-taxi to-transport-taxi/80 text-white",
  metro: "bg-gradient-to-br from-transport-metro to-transport-metro/80 text-white",
};

const INSTRUCTION_IMAGE_BASE = "/Instructions%20image%20folder/Instructions%20image%20folder";
const INSTRUCTION_IMAGES: Record<string, { folder: string; ext: string; count: number }> = {
  airport: { folder: "airport%20images", ext: "jpeg", count: 5 },
  metro: { folder: "metro%20images", ext: "jpeg", count: 5 },
  railway: { folder: "railways%20image", ext: "jpeg", count: 4 },
  taxi: { folder: "taxi%20image", ext: "jpg", count: 4 },
};

const Tutorial = () => {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const { triggerHaptic } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const mode = TRANSPORT_MODES.find((m) => m.id === modeId);
  const steps = TUTORIALS[modeId || "bus"] || TUTORIALS.bus;
  const headerThemeClass = transportThemeClass[modeId || ""] || "bg-foreground text-background";
  const imageConfig = INSTRUCTION_IMAGES[modeId || ""];
  const imageIndex = imageConfig ? (currentStep % imageConfig.count) + 1 : 1;
  const imageSrc = imageConfig
    ? `${INSTRUCTION_IMAGE_BASE}/${imageConfig.folder}/${imageIndex}.${imageConfig.ext}`
    : "";

  useEffect(() => {
    if (!imageConfig) return;
    const interval = window.setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [imageConfig, steps.length]);

  if (!mode) {
    return null;
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentTutorial = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      triggerHaptic([50]);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      triggerHaptic([50]);
    }
  };

  const handleComplete = () => {
    triggerHaptic([100, 50, 100, 50, 100]);
    navigate(`/explore/${modeId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className={`sticky top-0 z-40 px-4 py-4 safe-area-top ${headerThemeClass}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl bg-white/20 text-white hover:bg-white/30"
            onClick={() => navigate(`/explore/${modeId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-heading-3 font-bold text-white">{mode.name} Tutorial</h1>
            <p className="text-body-sm text-white/80">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl bg-white/20 text-white hover:bg-white/30"
            onClick={() => setCurrentStep(0)}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="mt-4 h-2 bg-white/20" />
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
        {/* 3D walkthrough */}
        <motion.div
          className="relative mb-6 aspect-video rounded-2xl bg-secondary overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={`walkthrough-${currentStep}`}
        >
          {imageConfig ? (
            <div className="relative h-full w-full">
              <img
                src={imageSrc}
                alt={`${mode.name} step ${currentStep + 1}`}
                className="h-full w-full object-cover kenburns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-blue-900 shadow">
                3D Walkthrough - Auto Loop
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="h-10 w-10 text-primary ml-1" />
              </motion.div>
              <p className="mt-4 text-body-md font-medium">3D Walkthrough</p>
              <p className="text-body-sm text-muted-foreground">
                Bus walkthrough will be added next
              </p>
            </div>
          )}
        </motion.div>

        {/* Tutorial content */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          key={`content-${currentStep}`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-heading-3 font-bold shrink-0">
              {currentStep + 1}
            </div>
            <div>
              <h2 className="text-heading-2 font-bold">{currentTutorial.title}</h2>
              <p className="mt-2 text-body-lg text-muted-foreground">
                {currentTutorial.description}
              </p>
            </div>
          </div>

          {/* Tip box */}
          <motion.div
            className="rounded-xl bg-accent/10 border border-accent/30 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-body-md">
              <span className="font-semibold text-accent">💡 Pro Tip:</span>{" "}
              {currentTutorial.tip}
            </p>
          </motion.div>
        </motion.div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 h-14"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              className="flex-1 h-14 bg-success hover:bg-success/90"
              onClick={handleComplete}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete
            </Button>
          ) : (
            <Button
              className="flex-1 h-14"
              onClick={handleNext}
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-secondary"
              }`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
      </main>
      <style>
        {`
          .kenburns {
            animation: kenburns 10s ease-in-out infinite;
            transform-origin: center;
          }
          @keyframes kenburns {
            0% {
              transform: scale(1) translate(0, 0);
            }
            50% {
              transform: scale(1.08) translate(-1%, -1%);
            }
            100% {
              transform: scale(1) translate(0, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Tutorial;
