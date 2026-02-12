import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { MapPin, Truck, Navigation } from "lucide-react";

interface VehicleLocation {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export default function VehicleTracker({
  vehicleId,
  startLocation,
  endLocation,
  onLocationUpdate,
}: {
  vehicleId: string;
  startLocation: { lat: number; lng: number; label: string };
  endLocation: { lat: number; lng: number; label: string };
  onLocationUpdate?: (location: VehicleLocation) => void;
}) {
  const { t } = useTranslation();
  const [vehicleLocation, setVehicleLocation] = useState<VehicleLocation | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate vehicle movement from start to end every 5 seconds
  useEffect(() => {
    if (!isTracking) return;

    // Simulate vehicle starting at startLocation and moving towards endLocation
    let progress = 0;
    const speed = 50; // km/h average
    const distance = calculateDistance(startLocation, endLocation);
    const durationMinutes = (distance / speed) * 60;

    intervalRef.current = setInterval(() => {
      progress += 5 / (durationMinutes * 1000);

      if (progress > 1) {
        progress = 1;
        setIsTracking(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      const lat =
        startLocation.lat + (endLocation.lat - startLocation.lat) * progress;
      const lng =
        startLocation.lng + (endLocation.lng - startLocation.lng) * progress;
      const heading = calculateHeading(startLocation, { lat, lng });

      const location: VehicleLocation = {
        lat,
        lng,
        speed: 45 + Math.random() * 15, // 45-60 km/h
        heading,
        timestamp: new Date(),
      };

      setVehicleLocation(location);
      setDistance(distance * progress);
      setEstimatedArrival(new Date(Date.now() + durationMinutes * (1 - progress) * 60000));

      onLocationUpdate?.(location);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking, vehicleId]);

  const calculateDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in km
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateHeading = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
    const dLng = p2.lng - p1.lng;
    const y = Math.sin(dLng) * Math.cos(p2.lat * (Math.PI / 180));
    const x =
      Math.cos(p1.lat * (Math.PI / 180)) * Math.sin(p2.lat * (Math.PI / 180)) -
      Math.sin(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) * Math.cos(dLng);
    const bearing = Math.atan2(y, x);
    return ((bearing * 180) / Math.PI + 360) % 360;
  };

  const startTracking = () => {
    setIsTracking(true);
    setVehicleLocation({
      lat: startLocation.lat,
      lng: startLocation.lng,
      speed: 0,
      timestamp: new Date(),
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <motion.div
      className="rounded-2xl bg-white border border-border p-4 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Vehicle Tracking
        </h3>
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            isTracking
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {isTracking ? "Stop Tracking" : "Start Tracking"}
        </button>
      </div>

      {vehicleLocation && isTracking && (
        <motion.div className="space-y-3">
          {/* Current Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-muted-foreground">Current Location</p>
              <p className="font-mono text-sm">
                {vehicleLocation.lat.toFixed(4)}, {vehicleLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Speed and Heading */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="font-semibold">{vehicleLocation.speed?.toFixed(1)} km/h</p>
            </div>
            <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
              <Navigation 
                className="h-5 w-5 text-primary" 
                style={{ transform: `rotate(${vehicleLocation.heading}deg)` }}
              />
              <div>
                <p className="text-xs text-muted-foreground">Heading</p>
                <p className="font-semibold">{vehicleLocation.heading?.toFixed(0)}°</p>
              </div>
            </div>
          </div>

          {/* Distance and ETA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Distance Traveled</p>
              <p className="font-semibold">{distance.toFixed(2)} km</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Est. Arrival</p>
              {estimatedArrival && (
                <p className="font-semibold">{estimatedArrival.toLocaleTimeString()}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Route Progress</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((distance / calculateDistance(startLocation, endLocation)) * 100) || 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Route info */}
          <div className="text-xs space-y-1 p-3 rounded-lg bg-muted">
            <p>
              <span className="font-semibold">From:</span> {startLocation.label}
            </p>
            <p>
              <span className="font-semibold">To:</span> {endLocation.label}
            </p>
          </div>
        </motion.div>
      )}

      {!isTracking && !vehicleLocation && (
        <motion.div
          className="py-8 text-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Click "Start Tracking" to track vehicle location</p>
        </motion.div>
      )}
    </motion.div>
  );
}
