import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HapticCompassProps {
  destination?: { lat: number; lng: number } | null;
  active?: boolean;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function bearingBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const brng = Math.atan2(y, x);
  return (brng * 180) / Math.PI + 360;
}

export default function HapticCompass({
  destination,
  active = true,
}: HapticCompassProps) {
  const [status, setStatus] = useState("Waiting for compass...");
  const [lastDirection, setLastDirection] = useState("center");
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPulseAtRef = useRef(0);

  const playSpatialPing = (pan: number) => {
    const AudioContextClass =
      globalThis.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(900, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    if (typeof context.createStereoPanner === "function") {
      const panner = context.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      oscillator.connect(gainNode).connect(panner).connect(context.destination);
    } else {
      oscillator.connect(gainNode).connect(context.destination);
    }

    oscillator.start(now);
    oscillator.stop(now + 0.13);
  };

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
            destination.lng,
          );
          const normalizedDiff = ((bearing - lastHeading + 540) % 360) - 180;
          const absDiff = Math.abs(normalizedDiff);

          const now = Date.now();
          if (now - lastPulseAtRef.current < 1500) return;
          lastPulseAtRef.current = now;

          if (absDiff < 12) {
            if ("vibrate" in navigator) navigator.vibrate([220]);
            playSpatialPing(0);
            setLastDirection("center");
            setStatus("Target locked");
          } else if (normalizedDiff < 0) {
            if ("vibrate" in navigator) navigator.vibrate([80, 50, 80]);
            playSpatialPing(-0.9);
            setLastDirection("left");
            setStatus("Turn left");
          } else {
            if ("vibrate" in navigator) navigator.vibrate([80, 40, 80, 40, 80]);
            playSpatialPing(0.9);
            setLastDirection("right");
            setStatus("Turn right");
          }
        },
        () => {
          setStatus("Location unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 4000 },
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
        <CardTitle>Sonic-Nav + Haptic-Pulse</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-muted-foreground">{status}</p>
        <p className="text-body-xs text-muted-foreground mt-1">
          Direction: {lastDirection}
        </p>
      </CardContent>
    </Card>
  );
}
