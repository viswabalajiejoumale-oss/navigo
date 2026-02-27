import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { io } from "socket.io-client";
import { useGuardianMode } from "@/hooks/useGuardianMode";
import { createPreArrivalNote } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Ambulance,
  Clock,
  Shield,
  Siren,
  TrafficCone,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";

const AmbulanceUser = () => {
  const navigate = useNavigate();
  const { state, triggerHaptic } = useApp();
  const [sirenAlert, setSirenAlert] = useState<{
    etaMinutes: number;
    startedAt: string;
  } | null>(null);
  const [corridorState, setCorridorState] = useState<{
    active: boolean;
    phase: string;
  } | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("unknown-vehicle");
  const [guardianEnabled, setGuardianEnabled] = useState(false);
  const [guardianContact, setGuardianContact] = useState("");
  const [hospitalId, setHospitalId] = useState("city-hospital");
  const [patientName, setPatientName] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const guardianRoomId = `safe-${selectedVehicleId}`;
  const { shareUrl, batteryLevel } = useGuardianMode({
    enabled: guardianEnabled,
    roomId: guardianRoomId,
    status: `Vehicle ${selectedVehicleId}`,
  });

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const liveSocket = io(socketUrl, { transports: ["websocket", "polling"] });

    liveSocket.on("connect", () => {
      liveSocket.emit("join_siren_zone", "city-core");
    });

    liveSocket.on("virtual_siren_alert", (payload) => {
      setSirenAlert({
        etaMinutes: Number(payload?.etaMinutes || 3),
        startedAt: payload?.startedAt || new Date().toISOString(),
      });
      triggerHaptic([300, 100, 300]);
    });

    liveSocket.on("active_corridor_update", (payload) => {
      setCorridorState({
        active: Boolean(payload?.active),
        phase: payload?.phase || "normal-flow",
      });
    });

    return () => {
      liveSocket.disconnect();
    };
  }, [triggerHaptic]);

  const handleCall = (contact: string, name: string) => {
    setSelectedVehicleId(name.replace(/\s+/g, "-").toLowerCase());
    triggerHaptic([100, 50, 100]);
    console.log(`Calling ambulance: ${contact}`);
    window.open(`tel:${contact}`, "_self");
  };

  const submitPreArrival = async () => {
    try {
      const payload = {
        ambulanceId: selectedVehicleId,
        hospitalId,
        patientName,
        bloodType,
        allergies,
        symptoms,
        etaMinutes: 8,
      };
      await createPreArrivalNote(payload);

      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const relaySocket = io(socketUrl, {
        transports: ["websocket", "polling"],
      });
      relaySocket.emit("pre_arrival_note_emit", payload);
      setTimeout(() => relaySocket.disconnect(), 400);

      triggerHaptic([100, 60, 100]);
    } catch (error) {
      console.error("Failed to submit pre-arrival note", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 border-b bg-destructive text-white px-4 py-4 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl text-white hover:bg-white/20"
            onClick={() => navigate("/ambulance")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading-2 font-bold">Available Ambulances</h1>
            <p className="text-body-sm text-white/80">
              {state.ambulanceAdmins.filter((a) => a.available).length}{" "}
              ambulances available
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
        <motion.div
          className="mb-6 rounded-xl border bg-secondary/30 p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <p className="text-label font-semibold">Guardian Safe-Link</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-body-sm font-medium">
                Share live trip with guardian
              </p>
              <p className="text-body-xs text-muted-foreground">
                Vehicle ID + location shared until destination
              </p>
            </div>
            <Switch
              checked={guardianEnabled}
              onCheckedChange={setGuardianEnabled}
            />
          </div>
          <Input
            value={guardianContact}
            onChange={(e) => setGuardianContact(e.target.value)}
            placeholder="Guardian contact number"
          />
          <p className="text-body-xs text-muted-foreground">
            Link: {shareUrl} • Battery: {batteryLevel}
          </p>
        </motion.div>

        <motion.div
          className="mb-6 rounded-xl border bg-secondary/30 p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-destructive" />
            <p className="text-label font-semibold">Vitals-to-ER Sync</p>
          </div>
          <Input
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            placeholder="Receiving hospital ID"
          />
          <Input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Patient name"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              placeholder="Blood type"
            />
            <Input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Allergies"
            />
          </div>
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Current symptoms / condition"
            className="min-h-[80px]"
          />
          <Button className="w-full" onClick={submitPreArrival}>
            Send Pre-Arrival Note
          </Button>
        </motion.div>

        {(sirenAlert || corridorState) && (
          <motion.div
            className="mb-6 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {sirenAlert && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
                <Siren className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-label font-semibold text-destructive">
                    Virtual Siren Alert
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    Ambulance approaching this zone in ~{sirenAlert.etaMinutes}{" "}
                    min. Please clear left lane.
                  </p>
                </div>
              </div>
            )}
            {corridorState && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3">
                <TrafficCone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-label font-semibold">
                    Active Corridor Simulation
                  </p>
                  <p className="text-body-sm text-muted-foreground capitalize">
                    {corridorState.active
                      ? "Traffic priority active"
                      : "Traffic returned to normal"}{" "}
                    • {corridorState.phase}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Emergency banner */}
        <motion.div
          className="mb-6 rounded-xl bg-destructive/10 border-2 border-destructive p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive animate-pulse">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-label font-semibold text-destructive">
                For Life-Threatening Emergencies
              </p>
              <p className="text-heading-3 font-bold">Call 102 or 108</p>
            </div>
          </div>
        </motion.div>

        {/* Available ambulances */}
        <h2 className="text-heading-3 font-bold mb-4">Nearby Ambulances</h2>
        <div className="space-y-4">
          {state.ambulanceAdmins.map((admin, index) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className={admin.available ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                        admin.available ? "bg-success" : "bg-muted"
                      }`}
                    >
                      <Ambulance className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-label font-semibold">
                          {admin.ownerName}
                        </h3>
                        {admin.available ? (
                          <span className="flex items-center gap-1 text-body-sm text-success">
                            <CheckCircle className="h-4 w-4" />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-body-sm text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            Busy
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 text-body-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <span>{admin.licenseNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{admin.ambulanceNumber}</span>
                        </div>
                      </div>

                      <p className="mt-2 text-body-sm font-medium text-primary">
                        {admin.vehicleType}
                      </p>
                    </div>
                  </div>

                  {admin.available && (
                    <div className="mt-4 flex gap-3">
                      <Button
                        className="flex-1 h-12 bg-success hover:bg-success/90"
                        onClick={() =>
                          handleCall(admin.contact, admin.ownerName)
                        }
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Call Now
                      </Button>
                      <Button variant="outline" className="h-12 gap-2">
                        <Clock className="h-5 w-5" />
                        ~5 min
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info section */}
        <motion.div
          className="mt-8 rounded-xl bg-secondary p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-label font-semibold mb-2">Types of Ambulances</h3>
          <ul className="space-y-2 text-body-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                Advanced Life Support (ALS):
              </span>{" "}
              Equipped with advanced medical equipment and trained paramedics
            </li>
            <li>
              <span className="font-medium text-foreground">
                Basic Life Support (BLS):
              </span>{" "}
              Standard emergency transport with basic medical equipment
            </li>
            <li>
              <span className="font-medium text-foreground">
                Patient Transport:
              </span>{" "}
              For non-emergency medical transport
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
};

export default AmbulanceUser;
