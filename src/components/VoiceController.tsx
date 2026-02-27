import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import { reportRoadHazard, reportCrowdDensity } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type HazardType = "pothole" | "broken_streetlight" | "sidewalk_obstruction";

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function extractHazard(transcript: string): HazardType | null {
  if (/pothole/.test(transcript)) return "pothole";
  if (/broken\s*street\s*light|streetlight/.test(transcript))
    return "broken_streetlight";
  if (/sidewalk\s*obstruction|blocked\s*sidewalk|obstruction/.test(transcript))
    return "sidewalk_obstruction";
  return null;
}

function getCrowdLevel(
  transcript: string,
): "plenty_seats" | "standing_only" | "full" | null {
  if (/plenty\s+of\s+seats|seats\s+available/.test(transcript))
    return "plenty_seats";
  if (/standing\s+room\s+only|standing\s+only/.test(transcript))
    return "standing_only";
  if (/bus\s+is\s+full|metro\s+is\s+full|full/.test(transcript)) return "full";
  return null;
}

async function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 7000,
    });
  });
}

export const VoiceController = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { transcript, startListening, browserSupportsSpeechRecognition } =
    useVoiceNavigation();
  const lastProcessedRef = useRef("");

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    startListening();
  }, [browserSupportsSpeechRecognition, startListening]);

  useEffect(() => {
    const normalized = transcript.trim().toLowerCase();
    if (!normalized || normalized === lastProcessedRef.current) return;
    if (!normalized.includes("navigo")) return;

    lastProcessedRef.current = normalized;

    const handleVoice = async () => {
      try {
        if (/book\s+my\s+usual\s+commute/.test(normalized)) {
          const usualRaw = localStorage.getItem("navigo_usual_commute");
          const usual = usualRaw ? JSON.parse(usualRaw) : null;
          const modeName =
            usual?.modeName || state.currentTransportMode || "bus";
          const route = `${usual?.pickup || "Home"} -> ${usual?.dropoff || "Work"}`;
          const qrCode = `VQ-${Date.now().toString(36).toUpperCase()}`;
          const bookingId = `VC${Math.floor(100000 + Math.random() * 900000)}`;

          localStorage.setItem(
            "navigo_last_voice_ticket",
            JSON.stringify({
              bookingId,
              qrCode,
              route,
              modeName,
              paid: true,
              source: "voice",
              bookedAt: new Date().toISOString(),
            }),
          );

          toast({
            title: "Voice Ticket Booked",
            description: `${route} confirmed. QR: ${qrCode}`,
          });
          speak(
            `Your usual commute is booked and paid. QR ticket ${qrCode} is ready.`,
          );
          navigate(`/explore/${state.currentTransportMode || "bus"}`);
          return;
        }

        if (/report/.test(normalized)) {
          const hazardType = extractHazard(normalized);
          if (hazardType && navigator.geolocation) {
            const position = await getCurrentPosition();
            await reportRoadHazard({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: hazardType,
              source: "voice",
            });
            toast({
              title: "Hazard Reported",
              description: `Logged ${hazardType.replace("_", " ")} at your location.`,
            });
            speak("Road hazard reported successfully.");
            return;
          }
        }

        const crowdLevel = getCrowdLevel(normalized);
        if (crowdLevel) {
          const mode = state.currentTransportMode || "bus";
          const routeId = `${mode}-city-core`;
          await reportCrowdDensity({
            routeId,
            mode,
            level: crowdLevel,
            reporterId: state.userProfile?.name || "voice-user",
          });
          toast({
            title: "Crowd Status Shared",
            description: `Thanks for reporting ${crowdLevel.replace("_", " ")}.`,
          });
          speak("Crowd status updated for nearby travelers.");
        }
      } catch {
        toast({
          title: "Voice Command Failed",
          description: "Please try again or use manual controls.",
        });
      }
    };

    void handleVoice();
  }, [
    navigate,
    state.currentTransportMode,
    state.userProfile?.name,
    transcript,
  ]);

  return null;
};
