import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Ambulance,
  User,
  Shield,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";

const AmbulanceSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl px-4 py-4 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading-2 font-bold">Ambulance Services</h1>
            <p className="text-body-sm text-muted-foreground">
              Choose your role
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <Ambulance className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-heading-2 font-bold">Emergency Medical Services</h2>
          <p className="mt-2 text-body-md text-muted-foreground">
            Select how you want to access ambulance services
          </p>
        </motion.div>

        <div className="grid gap-4">
          {/* User option */}
          <motion.button
            className="w-full text-left rounded-2xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5"
            onClick={() => navigate("/ambulance/user")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading-3 font-bold">I Need an Ambulance</h3>
                <p className="text-body-md text-muted-foreground mt-1">
                  View available ambulances and contact them directly
                </p>
              </div>
            </div>
          </motion.button>

          {/* Admin option */}
          <motion.button
            className="w-full text-left rounded-2xl border-2 border-border p-6 transition-all hover:border-accent hover:bg-accent/5"
            onClick={() => navigate("/ambulance/admin")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading-3 font-bold">I'm an Ambulance Owner</h3>
                <p className="text-body-md text-muted-foreground mt-1">
                  Register your ambulance and manage availability
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Emergency helpline */}
        <motion.div
          className="mt-8 rounded-xl bg-destructive/10 border border-destructive/30 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive">
              <Phone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-label font-semibold">Emergency Ambulance</p>
              <p className="text-heading-2 font-bold text-destructive">102</p>
            </div>
            <Button
              className="h-12 bg-destructive hover:bg-destructive/90"
              onClick={() => window.open("tel:102", "_self")}
            >
              Call Now
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AmbulanceSelection;
