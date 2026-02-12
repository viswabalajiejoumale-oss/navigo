import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Ambulance,
  Clock,
  Shield,
} from "lucide-react";

const AmbulanceUser = () => {
  const navigate = useNavigate();
  const { state, triggerHaptic } = useApp();

  const handleCall = (contact: string, name: string) => {
    triggerHaptic([100, 50, 100]);
    console.log(`Calling ambulance: ${contact}`);
    window.open(`tel:${contact}`, "_self");
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
              {state.ambulanceAdmins.filter((a) => a.available).length} ambulances available
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
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
                        <h3 className="text-label font-semibold">{admin.ownerName}</h3>
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
                        onClick={() => handleCall(admin.contact, admin.ownerName)}
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
              <span className="font-medium text-foreground">Advanced Life Support (ALS):</span>{" "}
              Equipped with advanced medical equipment and trained paramedics
            </li>
            <li>
              <span className="font-medium text-foreground">Basic Life Support (BLS):</span>{" "}
              Standard emergency transport with basic medical equipment
            </li>
            <li>
              <span className="font-medium text-foreground">Patient Transport:</span>{" "}
              For non-emergency medical transport
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
};

export default AmbulanceUser;
