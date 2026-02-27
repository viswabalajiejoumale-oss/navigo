import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { io, Socket } from "socket.io-client";
import { getPreArrivalNotes } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Ambulance,
  Shield,
  CheckCircle,
  Plus,
  User,
  Car,
  FileText,
  Phone,
  Siren,
  TrafficCone,
  Route,
  Hospital,
} from "lucide-react";

const AmbulanceAdmin = () => {
  const navigate = useNavigate();
  const { state, dispatch, triggerHaptic } = useApp();
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketReady, setSocketReady] = useState(false);
  const [corridorActive, setCorridorActive] = useState(false);
  const [corridorPhase, setCorridorPhase] = useState("green-wave");
  const [newAmbulance, setNewAmbulance] = useState({
    ownerName: "",
    licenseNumber: "",
    ambulanceNumber: "",
    vehicleType: "",
    contact: "",
  });
  const [preArrivalNotes, setPreArrivalNotes] = useState<
    Array<{
      id: string;
      ambulanceId: string;
      hospitalId: string;
      patientName: string;
      bloodType: string;
      allergies: string;
      symptoms: string;
      etaMinutes: number;
      createdAt: string;
    }>
  >([]);
  const [arAssistEnabled, setArAssistEnabled] = useState(false);
  const [arDistance, setArDistance] = useState(100);
  const [arCue, setArCue] = useState("Move straight to the entrance gate");

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const liveSocket = io(socketUrl, { transports: ["websocket", "polling"] });

    liveSocket.on("connect", () => {
      setSocketReady(true);
      liveSocket.emit("join_siren_zone", "city-core");
    });
    liveSocket.on("disconnect", () => setSocketReady(false));
    liveSocket.on("pre_arrival_note_admin", (note) => {
      setPreArrivalNotes((prev) => [note, ...prev].slice(0, 10));
    });

    setSocket(liveSocket);
    return () => {
      liveSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotes = async () => {
      try {
        const notes = await getPreArrivalNotes();
        if (active) setPreArrivalNotes(notes.slice(0, 10));
      } catch {
        if (active) setPreArrivalNotes([]);
      }
    };
    loadNotes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!arAssistEnabled) return;
    const interval = setInterval(() => {
      setArDistance((prev) => {
        const next = Math.max(prev - 10, 0);
        if (next <= 70 && next > 40) {
          setArCue("Turn slightly left after the pharmacy sign");
        } else if (next <= 40 && next > 10) {
          setArCue("Keep right and enter Gate 2");
        } else if (next <= 10) {
          setArCue("Destination reached: ambulance drop-point");
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [arAssistEnabled]);

  const handleRegister = async () => {
    if (
      newAmbulance.ownerName &&
      newAmbulance.licenseNumber &&
      newAmbulance.ambulanceNumber &&
      newAmbulance.vehicleType &&
      newAmbulance.contact
    ) {
      try {
        const payload = { ...newAmbulance, available: true };
        const api = await import("@/lib/api");
        const created = await api.registerAmbulance(payload);
        dispatch({
          type: "ADD_AMBULANCE_ADMIN",
          payload: created,
        });
        setNewAmbulance({
          ownerName: "",
          licenseNumber: "",
          ambulanceNumber: "",
          vehicleType: "",
          contact: "",
        });
        setShowRegisterForm(false);
        triggerHaptic([100, 50, 100]);
      } catch (err) {
        console.error("Failed to register ambulance:", err);
      }
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const api = await import("@/lib/api");
      const updated = await api.updateAmbulanceAvailability(id, !currentStatus);
      dispatch({
        type: "UPDATE_AMBULANCE_AVAILABILITY",
        payload: { id: updated.id, available: updated.available },
      });
      triggerHaptic([50]);
    } catch (err) {
      console.error("Failed to update availability:", err);
    }
  };

  const emitVirtualSiren = (ambulanceId: string) => {
    if (!socket) return;
    socket.emit("virtual_siren_emit", {
      zoneId: "city-core",
      ambulanceId,
      etaMinutes: 3,
      position: { lat: 12.976, lng: 80.219 },
    });
    triggerHaptic([120, 60, 120]);
  };

  const updateCorridor = (nextActive: boolean) => {
    if (!socket) return;
    const nextPhase = nextActive ? "green-wave" : "normal-flow";
    setCorridorActive(nextActive);
    setCorridorPhase(nextPhase);
    socket.emit("active_corridor_set", {
      zoneId: "city-core",
      active: nextActive,
      phase: nextPhase,
      signalPriority: nextActive ? "high" : "normal",
    });
    triggerHaptic(nextActive ? [100, 50, 100] : [50]);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <motion.header
        className="sticky top-0 z-40 border-b bg-accent text-accent-foreground px-4 py-4 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl text-accent-foreground hover:bg-white/20"
            onClick={() => navigate("/ambulance")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading-2 font-bold">Ambulance Admin</h1>
            <p className="text-body-sm opacity-80">
              Manage your ambulance services
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
        <motion.div
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-heading-1 font-bold text-primary">
                {state.ambulanceAdmins.length}
              </p>
              <p className="text-body-sm text-muted-foreground">
                Total Registered
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-heading-1 font-bold text-success">
                {state.ambulanceAdmins.filter((a) => a.available).length}
              </p>
              <p className="text-body-sm text-muted-foreground">
                Available Now
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-3 flex items-center gap-2">
                <Siren className="h-5 w-5 text-destructive" />
                Virtual Siren + Active Corridor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-muted/30 p-3 text-body-sm text-muted-foreground">
                Realtime status: {socketReady ? "Connected" : "Disconnected"} •
                Zone: city-core
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-label font-semibold">
                    Active Corridor (IoT Simulation)
                  </p>
                  <p className="text-body-sm text-muted-foreground capitalize">
                    Phase: {corridorPhase}
                  </p>
                </div>
                <Switch
                  checked={corridorActive}
                  onCheckedChange={updateCorridor}
                  aria-label="Toggle active corridor"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-3 flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                AR Wayfinding (Last 100m)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-muted/30 p-3 flex items-center justify-between">
                <p className="text-body-sm">
                  AR assist for dense building entrances
                </p>
                <Switch
                  checked={arAssistEnabled}
                  onCheckedChange={(checked) => {
                    setArAssistEnabled(checked);
                    setArDistance(100);
                    setArCue("Move straight to the entrance gate");
                  }}
                />
              </div>
              {arAssistEnabled && (
                <div className="rounded-xl border bg-primary/10 p-3">
                  <p className="text-label font-semibold">
                    Distance: {arDistance}m
                  </p>
                  <p className="text-body-sm text-muted-foreground">{arCue}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-3 flex items-center gap-2">
                <Hospital className="h-5 w-5 text-destructive" />
                Vitals-to-ER Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preArrivalNotes.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                  No incoming pre-arrival notes yet.
                </p>
              ) : (
                preArrivalNotes.map((note) => (
                  <div key={note.id} className="rounded-xl border p-3">
                    <p className="text-label font-semibold">
                      {note.patientName} • {note.bloodType}
                    </p>
                    <p className="text-body-sm text-muted-foreground">
                      Hospital: {note.hospitalId} • ETA {note.etaMinutes}m
                    </p>
                    <p className="text-body-sm text-muted-foreground">
                      Allergies: {note.allergies}
                    </p>
                    <p className="text-body-sm">Symptoms: {note.symptoms}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {!showRegisterForm ? (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              className="w-full h-14 gap-2"
              onClick={() => setShowRegisterForm(true)}
            >
              <Plus className="h-5 w-5" />
              Register New Ambulance
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  Register Ambulance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Owner Name
                  </Label>
                  <Input
                    className="h-12 mt-1"
                    placeholder="Enter owner name"
                    value={newAmbulance.ownerName}
                    onChange={(e) =>
                      setNewAmbulance({
                        ...newAmbulance,
                        ownerName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    License Number
                  </Label>
                  <Input
                    className="h-12 mt-1"
                    placeholder="e.g., AMB-2024-001"
                    value={newAmbulance.licenseNumber}
                    onChange={(e) =>
                      setNewAmbulance({
                        ...newAmbulance,
                        licenseNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle Number
                  </Label>
                  <Input
                    className="h-12 mt-1"
                    placeholder="e.g., KA-01-AB-1234"
                    value={newAmbulance.ambulanceNumber}
                    onChange={(e) =>
                      setNewAmbulance({
                        ...newAmbulance,
                        ambulanceNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Vehicle Type</Label>
                  <Select
                    value={newAmbulance.vehicleType}
                    onValueChange={(value) =>
                      setNewAmbulance({ ...newAmbulance, vehicleType: value })
                    }
                  >
                    <SelectTrigger className="h-12 mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advanced Life Support">
                        Advanced Life Support (ALS)
                      </SelectItem>
                      <SelectItem value="Basic Life Support">
                        Basic Life Support (BLS)
                      </SelectItem>
                      <SelectItem value="Patient Transport">
                        Patient Transport
                      </SelectItem>
                      <SelectItem value="Neonatal">
                        Neonatal Ambulance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Number
                  </Label>
                  <Input
                    className="h-12 mt-1"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newAmbulance.contact}
                    onChange={(e) =>
                      setNewAmbulance({
                        ...newAmbulance,
                        contact: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setShowRegisterForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 h-12" onClick={handleRegister}>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Register
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <h2 className="text-heading-3 font-bold mb-4">Your Ambulances</h2>
        <div className="space-y-4">
          {state.ambulanceAdmins.map((admin, index) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          admin.available ? "bg-success" : "bg-muted"
                        }`}
                      >
                        <Ambulance className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-label font-semibold">
                          {admin.ownerName}
                        </h3>
                        <p className="text-body-sm text-muted-foreground">
                          {admin.ambulanceNumber}
                        </p>
                        <p className="text-body-sm text-primary mt-1">
                          {admin.vehicleType}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={admin.available}
                        onCheckedChange={() =>
                          toggleAvailability(admin.id, admin.available)
                        }
                      />
                      <span className="text-body-sm text-muted-foreground">
                        {admin.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-body-sm">
                    <div>
                      <p className="text-muted-foreground">License</p>
                      <p className="font-medium">{admin.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">{admin.contact}</p>
                    </div>
                  </div>

                  {admin.available && (
                    <Button
                      variant="outline"
                      className="mt-4 h-11 w-full gap-2"
                      onClick={() => emitVirtualSiren(admin.id)}
                    >
                      <TrafficCone className="h-5 w-5" />
                      Trigger Virtual Siren Alert
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AmbulanceAdmin;
