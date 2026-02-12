import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HapticCompassProps {
  destination?: { lat: number; lng: number } | null;
  active?: boolean;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const brng = Math.atan2(y, x);
  return (brng * 180) / Math.PI + 360;
}

export default function HapticCompass({ destination, active = true }: HapticCompassProps) {
  const [status, setStatus] = useState("Waiting for compass...");

  useEffect(() => {
    if (!active || !destination) return;
    let lastHeading = 0;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.alpha !== "number") return;
      lastHeading = event.alpha;
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const bearing = bearingBetween(
            pos.coords.latitude,
            pos.coords.longitude,
            destination.lat,
            destination.lng
          );
          const diff = Math.abs(((lastHeading - bearing + 540) % 360) - 180);

          if (diff < 10) {
            if ("vibrate" in navigator) {
              navigator.vibrate(200);
            }
            setStatus("Target locked");
          } else if (diff < 45) {
            if ("vibrate" in navigator) {
              navigator.vibrate([50, 50]);
            }
            setStatus("Adjust direction");
          } else {
            setStatus("Reorient to target");
          }
        },
        () => {
          setStatus("Location unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 4000 }
      );
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [active, destination]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Haptic Compass</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-muted-foreground">{status}</p>
      </CardContent>
    </Card>
  );
}
