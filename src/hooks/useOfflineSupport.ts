import { useEffect, useState } from "react";

export function useOfflineSupport() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const triggerSmsTrack = (phone = "+919876543210", body = "TRACK BUS 500") => {
    const link = `sms:${phone}?body=${encodeURIComponent(body)}`;
    window.location.href = link;

    setTimeout(() => {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          "SMS sent. Waiting for reply."
        );
        window.speechSynthesis.speak(utterance);
      }
    }, 5000);
  };

  return {
    isOffline,
    triggerSmsTrack,
  };
}
