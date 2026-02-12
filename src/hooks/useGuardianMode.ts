import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface GuardianOptions {
  enabled: boolean;
  roomId: string;
  status: string;
}

export function useGuardianMode({ enabled, roomId, status }: GuardianOptions) {
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<string>("N/A");
  const batteryRef = useRef<string>("N/A");

  useEffect(() => {
    if (!enabled || !roomId) return;

    let mounted = true;

    const socket = io(BASE_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join_room", roomId);

    const updateBattery = async () => {
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as any).getBattery();
          if (!mounted) return;
          const next = `${Math.round(battery.level * 100)}%`;
          batteryRef.current = next;
          setBatteryLevel(next);
        }
      } catch {
        if (mounted) {
          batteryRef.current = "N/A";
          setBatteryLevel("N/A");
        }
      }
    };

    updateBattery();

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          lastLocationRef.current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        },
        () => {
          // ignore location errors; still keep socket alive
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    intervalRef.current = window.setInterval(async () => {
      await updateBattery();
      if (!lastLocationRef.current) return;

      socket.emit("telemetry_update", {
        roomId,
        lat: lastLocationRef.current.lat,
        lng: lastLocationRef.current.lng,
        battery: batteryRef.current,
        status,
      });
    }, 5000);

    return () => {
      mounted = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, roomId, status]);

  return {
    shareUrl: `navigo.app/track/${roomId}`,
    batteryLevel,
  };
}
