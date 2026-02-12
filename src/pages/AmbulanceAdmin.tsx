import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
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
} from "lucide-react";

const AmbulanceAdmin = () => {
  const navigate = useNavigate();
  const { state, dispatch, triggerHaptic } = useApp();
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    ownerName: "",
    licenseNumber: "",
    ambulanceNumber: "",
    vehicleType: "",
    contact: "",
  });

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
        // lazy import to avoid unused import if API not configured
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
        console.log("Ambulance registered successfully");
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
      console.log(updated.available ? "Ambulance marked as available" : "Ambulance marked as unavailable");
    } catch (err) {
      console.error("Failed to update availability:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
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
        {/* Stats */}
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
              <p className="text-body-sm text-muted-foreground">Total Registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-heading-1 font-bold text-success">
                {state.ambulanceAdmins.filter((a) => a.available).length}
              </p>
              <p className="text-body-sm text-muted-foreground">Available Now</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Register new ambulance */}
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
                      setNewAmbulance({ ...newAmbulance, ownerName: e.target.value })
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
                      setNewAmbulance({ ...newAmbulance, licenseNumber: e.target.value })
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
                      setNewAmbulance({ ...newAmbulance, ambulanceNumber: e.target.value })
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
                      <SelectItem value="Neonatal">Neonatal Ambulance</SelectItem>
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
                      setNewAmbulance({ ...newAmbulance, contact: e.target.value })
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

        {/* Registered ambulances */}
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
                        <h3 className="text-label font-semibold">{admin.ownerName}</h3>
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
