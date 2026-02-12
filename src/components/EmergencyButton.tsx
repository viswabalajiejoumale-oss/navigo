import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { EMERGENCY_CONTACTS, HAPTIC_PATTERNS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Phone,
  X,
  MapPin,
  Shield,
  Share2,
} from "lucide-react";

const EmergencyButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, triggerHaptic } = useApp();

  const handleEmergencyPress = () => {
    setIsOpen(true);
    triggerHaptic(HAPTIC_PATTERNS.alert);
  };

  const handleCall = (contact: { name: string; number: string }) => {
    triggerHaptic(HAPTIC_PATTERNS.emergency);
    console.log(`Calling ${contact.name}: ${contact.number}`);
    // In production, this would use tel: protocol
    window.open(`tel:${contact.number}`, "_self");
  };

  const handleShareLocation = () => {
    triggerHaptic([100, 50, 100]);
    console.log("Sharing live location with trusted contacts");
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location:", position.coords.latitude, position.coords.longitude);
          // In production, send to backend/contacts
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  // Get context-specific contacts based on current transport mode
  const getContextContacts = () => {
    const mode = state.currentTransportMode;
    const baseContacts = [
      EMERGENCY_CONTACTS.nationalEmergency,
      EMERGENCY_CONTACTS.police,
      EMERGENCY_CONTACTS.ambulance,
    ];

    switch (mode) {
      case "railway":
        return [...baseContacts, EMERGENCY_CONTACTS.railwayPolice];
      case "bus":
        return [...baseContacts, EMERGENCY_CONTACTS.roadAccident];
      default:
        return [...baseContacts, EMERGENCY_CONTACTS.womenHelpline];
    }
  };

  const contextContacts = getContextContacts();

  return (
    <>
      {/* Emergency FAB */}
      <motion.button
        className="emergency-btn"
        onClick={handleEmergencyPress}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Emergency SOS"
      >
        <AlertTriangle className="h-8 w-8 text-white" />
      </motion.button>

      {/* Emergency modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-x-4 bottom-4 z-50 rounded-3xl bg-card p-6 shadow-2xl safe-area-bottom sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2"
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-heading-3 font-bold">Emergency SOS</h2>
                    <p className="text-body-sm text-muted-foreground">
                      Quick access to help
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Emergency contacts */}
              <div className="space-y-3 mb-4">
                {contextContacts.map((contact) => (
                  <motion.button
                    key={contact.number}
                    className="w-full flex items-center gap-4 rounded-xl bg-destructive/10 p-4 transition-colors hover:bg-destructive/20"
                    onClick={() => handleCall(contact)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-label font-semibold">{contact.name}</p>
                      <p className="text-body-sm text-muted-foreground">
                        {contact.number}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Additional actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1"
                  onClick={handleShareLocation}
                >
                  <Share2 className="h-5 w-5" />
                  <span className="text-body-sm">Share Location</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1"
                  onClick={() => {
                    console.log("Sharing ride details");
                  }}
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-body-sm">Share Ride</span>
                </Button>
              </div>

              {/* Women helpline quick access */}
              <motion.button
                className="mt-4 w-full flex items-center gap-4 rounded-xl bg-pink-500/10 p-4 border-2 border-pink-500/30"
                onClick={() => handleCall(EMERGENCY_CONTACTS.womenHelpline)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-label font-semibold">Women Helpline</p>
                  <p className="text-body-sm text-muted-foreground">
                    {EMERGENCY_CONTACTS.womenHelpline.number}
                  </p>
                </div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyButton;
