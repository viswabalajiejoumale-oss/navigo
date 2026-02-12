import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TRANSPORT_MODES, GOOGLE_MAPS_API_KEY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EmergencyButton from "@/components/EmergencyButton";
import GoogleMap from "@/components/GoogleMap";
import BookingDialog from "@/components/BookingDialog";
import HapticCompass from "@/components/HapticCompass";
import { useOfflineSupport } from "@/hooks/useOfflineSupport";
import { getNearbyBarriers } from "@/lib/api";
import {
  ArrowLeft,
  MapPin,
  Clock,
  IndianRupee,
  Bus,
  Car,
  TrainFront,
  PlayCircle,
  Accessibility,
  Phone,
  Navigation,
  Ticket,
} from "lucide-react";

const DEMO_DESTINATIONS = [
  { id: 1, name: "Central Station", distance: "5.2 km", time: "25 min", lat: 12.976, lng: 80.219 },
  { id: 2, name: "Airport Terminal 1", distance: "22 km", time: "45 min", lat: 12.99, lng: 80.169 },
  { id: 3, name: "Tech Park", distance: "8.5 km", time: "35 min", lat: 12.982, lng: 80.245 },
];

const COMPARISON_DATA = {
  bus: { time: "45 min", cost: 35 },
  taxi: { time: "25 min", cost: 250 },
  metro: { time: "30 min", cost: 45 },
};

const SCHEDULE_DATA: Record<
  string,
  { label: string; location: string; time: string; status: string; statusTone: "success" | "warning" | "muted" }[]
> = {
  bus: [
    { label: "Next bus", location: "Stop A", time: "08:05", status: "Available", statusTone: "success" },
    { label: "Following", location: "Stop B", time: "08:22", status: "Available", statusTone: "success" },
    { label: "Later", location: "Stop C", time: "08:41", status: "Available", statusTone: "success" },
  ],
  airport: [
    { label: "Next departure", location: "Gate B3", time: "09:10", status: "Boarding", statusTone: "warning" },
    { label: "Following", location: "Gate A1", time: "09:55", status: "On Time", statusTone: "success" },
    { label: "Later", location: "Gate C2", time: "10:30", status: "On Time", statusTone: "success" },
  ],
  railway: [
    { label: "Next departure", location: "Platform 2", time: "07:50", status: "On Time", statusTone: "success" },
    { label: "Following", location: "Platform 5", time: "08:25", status: "6 min delay", statusTone: "warning" },
    { label: "Later", location: "Platform 1", time: "09:05", status: "On Time", statusTone: "success" },
  ],
  taxi: [
    { label: "Next pickup", location: "Stand 4", time: "08:12", status: "Arriving", statusTone: "warning" },
    { label: "Following", location: "Stand 2", time: "08:29", status: "Available", statusTone: "success" },
    { label: "Later", location: "Stand 1", time: "08:47", status: "Available", statusTone: "success" },
  ],
  metro: [
    { label: "Next departure", location: "Platform 3", time: "08:03", status: "On Time", statusTone: "success" },
    { label: "Following", location: "Platform 1", time: "08:18", status: "On Time", statusTone: "success" },
    { label: "Later", location: "Platform 2", time: "08:34", status: "3 min delay", statusTone: "warning" },
  ],
};

const transportThemeClass: Record<string, string> = {
  bus: "bg-gradient-to-br from-transport-bus to-transport-bus/80 text-white",
  airport: "bg-gradient-to-br from-transport-airport to-transport-airport/80 text-white",
  railway: "bg-gradient-to-br from-transport-railway to-transport-railway/80 text-white",
  taxi: "bg-gradient-to-br from-transport-taxi to-transport-taxi/80 text-white",
  metro: "bg-gradient-to-br from-transport-metro to-transport-metro/80 text-white",
};

const ExploreMode = () => {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const { state, triggerHaptic } = useApp();
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { isOffline, triggerSmsTrack } = useOfflineSupport();

  const mode = TRANSPORT_MODES.find((m) => m.id === modeId);
  const headerThemeClass = transportThemeClass[modeId || ""] || "bg-foreground text-background";

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Mode not found</p>
      </div>
    );
  }

  const handleDestinationSelect = (destId: number) => {
    setSelectedDestination(destId);
    setShowComparison(true);
    triggerHaptic([50]);
  };

  const handleWheelchairRequest = () => {
    triggerHaptic([100, 50, 100, 50, 100]);
    console.log("Wheelchair assistance requested");
  };

  const handleStartTutorial = () => {
    navigate(`/tutorial/${modeId}`);
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const nearby = await getNearbyBarriers(
            pos.coords.latitude,
            pos.coords.longitude,
            500
          );
          if (nearby.length > 0 && "speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(
              "Caution. The lift ahead is reported broken."
            );
            window.speechSynthesis.speak(utterance);
          }
        } catch {
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(
              "Service unavailable, checking cached data."
            );
            window.speechSynthesis.speak(utterance);
          }
        }
      },
      () => {
        // ignore location errors
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
    );
  }, [modeId]);

  return (
    <div className="min-h-screen bg-background pb-24">
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
            onClick={() => navigate("/dashboard")}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading-2 font-bold text-white">{mode.name}</h1>
            <p className="text-body-sm text-white/80">{mode.description}</p>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
        {isOffline && (
          <motion.div
            className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-body-sm font-medium">SMS Mode Active</p>
            <p className="text-body-xs text-muted-foreground">
              You are offline. Use SMS to track your bus.
            </p>
            {modeId === "bus" && (
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => triggerSmsTrack()}
                aria-label="Track bus via SMS"
              >
                Track Bus
              </Button>
            )}
          </motion.div>
        )}
        {/* Live Map */}
        <motion.div
          className="relative mb-6 h-[28rem] md:h-[32rem] rounded-2xl bg-secondary overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GoogleMap apiKey={GOOGLE_MAPS_API_KEY} enableDistance />
        </motion.div>

        {selectedDestination && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HapticCompass
              destination={DEMO_DESTINATIONS.find((d) => d.id === selectedDestination) || null}
              active={state.hapticMode}
            />
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="outline"
            className="h-14 gap-2"
            onClick={handleStartTutorial}
            aria-label="Open tutorial"
          >
            <PlayCircle className="h-5 w-5 text-accent" />
            <span>Tutorial</span>
          </Button>
          {modeId !== "bus" ? (
            <Button
              variant="outline"
              className="h-14 gap-2"
              onClick={() => setBookingOpen(true)}
              aria-label="Book transport"
            >
              <Ticket className="h-5 w-5 text-primary" />
              <span>Book</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-14 gap-2"
              onClick={() => scheduleRef.current?.scrollIntoView({ behavior: "smooth" })}
              aria-label="View available buses"
            >
              <Ticket className="h-5 w-5 text-primary" />
              <span>Available buses</span>
            </Button>
          )}
          {state.hapticMode && (
            <Button
              className="h-14 gap-2 bg-primary"
              onClick={handleWheelchairRequest}
              aria-label="Request wheelchair assistance"
            >
              <Accessibility className="h-5 w-5" />
              <span>Wheelchair</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="h-14 gap-2"
            onClick={() => {
              const helpline = mode.helplines[0];
              console.log(`Calling helpline: ${helpline}`);
              window.open(`tel:${helpline}`, "_self");
            }}
            aria-label="Call helpline"
          >
            <Phone className="h-5 w-5 text-destructive" />
            <span>Helpline</span>
          </Button>
        </motion.div>

        {/* Destinations */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-heading-3 font-bold mb-4">Popular Destinations</h2>
          <div className="space-y-3">
            {DEMO_DESTINATIONS.map((dest) => (
              <motion.button
                key={dest.id}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  selectedDestination === dest.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleDestinationSelect(dest.id)}
                aria-label={`Select destination ${dest.name}`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Navigation className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-label font-semibold">{dest.name}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {dest.distance} • {dest.time}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Route comparison */}
        {showComparison && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <h2 className="text-heading-3 font-bold mb-4">Route Comparison</h2>
            <div className="grid gap-3">
              {Object.entries(COMPARISON_DATA).map(([type, data]) => (
                <Card
                  key={type}
                  className={`${
                    type === modeId ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {type === "bus" && <Bus className="h-6 w-6 text-transport-bus" />}
                        {type === "taxi" && <Car className="h-6 w-6 text-transport-taxi" />}
                        {type === "metro" && <TrainFront className="h-6 w-6 text-transport-metro" />}
                        <span className="text-label font-semibold capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-body-sm">{data.time}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold">
                          <IndianRupee className="h-4 w-4" />
                          <span>{data.cost}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Savings tip */}
            <motion.div
              className="mt-4 rounded-xl bg-success/10 border border-success/30 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-body-sm text-success font-medium">
                💡 Taking the Metro instead of a Taxi saves you ₹205!
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Schedule info */}
        <motion.div
          ref={scheduleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-heading-3 font-bold mb-4">Live Schedule</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {(SCHEDULE_DATA[modeId || "bus"] || SCHEDULE_DATA.bus).map((item, index, arr) => {
                const statusClass =
                  item.statusTone === "success"
                    ? "text-success"
                    : item.statusTone === "warning"
                    ? "text-warning"
                    : "text-muted-foreground";
                return (
                  <div
                    key={`${item.label}-${item.time}`}
                    className={`flex items-center justify-between ${index < arr.length - 1 ? "pb-3 border-b" : ""}`}
                  >
                    <div>
                      <p className="text-label font-semibold">{item.label}</p>
                      <p className="text-body-sm text-muted-foreground">{item.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-heading-3 font-bold text-primary">{item.time}</p>
                      <p className={`text-body-sm ${statusClass}`}>{item.status}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <EmergencyButton />

      {modeId !== "bus" && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          modeName={mode.name}
        />
      )}
    </div>
  );
};

export default ExploreMode;
