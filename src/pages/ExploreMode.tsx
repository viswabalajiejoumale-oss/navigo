import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TRANSPORT_MODES, GOOGLE_MAPS_API_KEY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EmergencyButton from "@/components/EmergencyButton";
import GoogleMap from "@/components/GoogleMap";
import BookingDialog from "@/components/BookingDialog";
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
  { id: 1, name: "Central Station", distance: "5.2 km", time: "25 min" },
  { id: 2, name: "Airport Terminal 1", distance: "22 km", time: "45 min" },
  { id: 3, name: "Tech Park", distance: "8.5 km", time: "35 min" },
];

const COMPARISON_DATA = {
  bus: { time: "45 min", cost: 35 },
  taxi: { time: "25 min", cost: 250 },
  metro: { time: "30 min", cost: 45 },
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
        {/* Live Map */}
        <motion.div
          className="relative mb-6 h-[28rem] md:h-[32rem] rounded-2xl bg-secondary overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GoogleMap apiKey={GOOGLE_MAPS_API_KEY} enableDistance />
        </motion.div>

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
          >
            <PlayCircle className="h-5 w-5 text-accent" />
            <span>Tutorial</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 gap-2"
            onClick={() => setBookingOpen(true)}
          >
            <Ticket className="h-5 w-5 text-primary" />
            <span>Book</span>
          </Button>
          {state.hapticMode && (
            <Button
              className="h-14 gap-2 bg-primary"
              onClick={handleWheelchairRequest}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-heading-3 font-bold mb-4">Live Schedule</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <p className="text-label font-semibold">Next departure</p>
                  <p className="text-body-sm text-muted-foreground">Platform 3</p>
                </div>
                <div className="text-right">
                  <p className="text-heading-3 font-bold text-primary">10:45</p>
                  <p className="text-body-sm text-success">On Time</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <p className="text-label font-semibold">Following</p>
                  <p className="text-body-sm text-muted-foreground">Platform 5</p>
                </div>
                <div className="text-right">
                  <p className="text-heading-3 font-bold">11:15</p>
                  <p className="text-body-sm text-warning">5 min delay</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label font-semibold">Later</p>
                  <p className="text-body-sm text-muted-foreground">Platform 3</p>
                </div>
                <div className="text-right">
                  <p className="text-heading-3 font-bold">11:45</p>
                  <p className="text-body-sm text-success">On Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <EmergencyButton />

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        modeName={mode.name}
      />
    </div>
  );
};

export default ExploreMode;
