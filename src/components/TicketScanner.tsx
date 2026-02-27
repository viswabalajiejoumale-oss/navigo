import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scanTicket } from "@/lib/api";
import { useApp } from "@/context/AppContext";

const videoConstraints = {
  facingMode: "environment",
};

export default function TicketScanner() {
  const webcamRef = useRef<Webcam>(null);
  const { dispatch } = useApp();
  const [cameraOn, setCameraOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation: string;
    status: "ongoing" | "expired" | "unknown";
    expiresAt?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletRecommendation, setWalletRecommendation] = useState<
    string | null
  >(null);
  const [ticketFrequency, setTicketFrequency] = useState(0);

  const parseDateTimeFromText = (text: string): Date | null => {
    const patterns = [
      /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
      /(\d{1,2})-(\d{1,2})-(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (!match) continue;

      let year = Number(match[1]);
      let month = Number(match[2]);
      let day = Number(match[3]);
      const hourRaw = Number(match[4]);
      const minute = Number(match[5]);
      const meridian = match[6]?.toUpperCase();

      if (year < 100) year += 2000;
      if (pattern !== patterns[0]) {
        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
        if (year < 100) year += 2000;
      }

      let hour = hourRaw;
      if (meridian === "PM" && hour < 12) hour += 12;
      if (meridian === "AM" && hour === 12) hour = 0;

      const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
  };

  const speak = (message: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const parseTicketInfo = (explanation: string) => {
    const lowerText = explanation.toLowerCase();

    // Extract transport type
    let transportType = "bus";
    if (lowerText.includes("train") || lowerText.includes("railway"))
      transportType = "train";
    else if (
      lowerText.includes("flight") ||
      lowerText.includes("airport") ||
      lowerText.includes("plane")
    )
      transportType = "flight";
    else if (lowerText.includes("metro") || lowerText.includes("subway"))
      transportType = "metro";

    // Try to extract origin, destination, platform from natural text
    const originMatch = explanation.match(
      /(?:origin|from)[:\s]+([A-Za-z\s]+?)(?:destination|to|\n|,)/i,
    );
    const destMatch = explanation.match(
      /(?:destination|to)[:\s]+([A-Za-z\s]+?)(?:\n|,|\.|\)|platform)/i,
    );
    const platformMatch = explanation.match(/(?:platform|gate)[:\s#]*(\w+)/i);
    const timeMatch = explanation.match(
      /(\d{1,2}[:\s]?\d{2}\s*(?:AM|PM)?|\d{4}-\d{2}-\d{2})/i,
    );

    // Determine status from explanation text + parsed time
    let status: "ongoing" | "expired" | "unknown" = "unknown";
    if (
      lowerText.includes("expired") ||
      lowerText.includes("not valid") ||
      lowerText.includes("past")
    ) {
      status = "expired";
    } else if (
      lowerText.includes("valid") ||
      lowerText.includes("ongoing") ||
      lowerText.includes("active")
    ) {
      status = "ongoing";
    }

    const expiryDate = parseDateTimeFromText(explanation);
    if (expiryDate) {
      status = expiryDate.getTime() < Date.now() ? "expired" : "ongoing";
    }

    return {
      origin: originMatch?.[1]?.trim() || "",
      destination: destMatch?.[1]?.trim() || "",
      time: timeMatch?.[0]?.trim() || "",
      transportType,
      platform: platformMatch?.[1]?.trim() || "",
      status,
      expiresAt: expiryDate?.toISOString() || null,
    };
  };

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setError("Camera capture failed.");
        return;
      }

      const resp = await scanTicket(imageSrc);
      const explanation = resp.raw || "";

      if (!explanation) {
        setError("Could not read ticket.");
        return;
      }

      const parsed = parseTicketInfo(explanation);

      const nowIso = new Date().toISOString();
      const existing = localStorage.getItem("navigo_ticket_scans");
      const scans: Array<{
        scannedAt: string;
        status: string;
        transportType: string;
      }> = existing ? JSON.parse(existing) : [];
      const updatedScans = [
        ...scans,
        {
          scannedAt: nowIso,
          status: parsed.status,
          transportType: parsed.transportType,
        },
      ];
      localStorage.setItem(
        "navigo_ticket_scans",
        JSON.stringify(updatedScans.slice(-200)),
      );

      const last30 = updatedScans.filter((scan) => {
        const days =
          (Date.now() - new Date(scan.scannedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return days <= 30;
      });
      setTicketFrequency(last30.length);

      if (parsed.status === "expired") {
        setWalletRecommendation(
          "Your ticket is expired. Auto-renew now to avoid last-minute queues.",
        );
      } else if (last30.length >= 12) {
        setWalletRecommendation(
          "Frequent traveler detected: Monthly pass could reduce your ticket cost significantly.",
        );
      } else if (last30.length >= 5) {
        setWalletRecommendation(
          "Consider auto-renew for your regular route to skip manual booking.",
        );
      } else {
        setWalletRecommendation(
          "Ticket wallet looks healthy. Keep scanning for smarter renewal suggestions.",
        );
      }

      dispatch({
        type: "SET_TRIP_DETAILS",
        payload: {
          origin: parsed.origin,
          destination: parsed.destination,
          time: parsed.time,
          transportType: parsed.transportType,
          platform: parsed.platform,
          scannedAt: new Date().toISOString(),
          status: parsed.status,
        },
      });

      const spokenPlatform = parsed.platform
        ? `Platform ${parsed.platform}`
        : "the platform";
      const spokenDestination = parsed.destination || "your destination";
      const statusMessage =
        parsed.status === "expired"
          ? "Warning: This ticket has expired."
          : "Ticket is valid.";
      speak(
        `${statusMessage} Navigating to ${spokenPlatform} for ${spokenDestination}.`,
      );

      setResult({
        explanation,
        status: parsed.status,
        expiresAt: parsed.expiresAt,
      });
    } catch (err: unknown) {
      const status =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { status?: number } }).response?.status ===
          "number"
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401) {
        setError("AI service unauthorized.");
      } else {
        setError("Ticket scan failed.");
        speak("Service unavailable, checking cached data.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Lens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative rounded-xl overflow-hidden border">
          {cameraOn ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-56 object-cover"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-muted">
              <p className="text-body-sm text-muted-foreground">
                Camera is off
              </p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <div className="w-10/12 h-1 bg-white/20 overflow-hidden rounded-full">
                <div className="h-full w-1/3 bg-white/80 animate-bounce" />
              </div>
              <p className="mt-3 text-body-sm text-white">Scanning ticket...</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setCameraOn((prev) => !prev)}
            variant="outline"
            aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
          >
            {cameraOn ? "Camera Off" : "Camera On"}
          </Button>
          <Button
            onClick={handleScan}
            disabled={loading || !cameraOn}
            aria-label="Scan ticket"
          >
            {loading ? "Scanning..." : "Scan Ticket"}
          </Button>
        </div>
        {error && <p className="text-body-sm text-destructive">{error}</p>}
        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-medium">Ticket Information</p>
              <span
                className={`px-2 py-1 rounded-full text-body-xs font-semibold ${
                  result.status === "ongoing"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : result.status === "expired"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {result.status === "ongoing"
                  ? "✓ Valid"
                  : result.status === "expired"
                    ? "✗ Expired"
                    : "? Unknown"}
              </span>
            </div>
            <p className="text-body-sm whitespace-pre-wrap leading-relaxed">
              {result.explanation}
            </p>
            {result.expiresAt && (
              <p className="text-body-xs text-muted-foreground">
                Validation timestamp:{" "}
                {new Date(result.expiresAt).toLocaleString()}
              </p>
            )}
            <div className="rounded-lg border bg-background p-3 space-y-2">
              <p className="text-body-sm font-medium">Smart Ticket Wallet</p>
              <p className="text-body-xs text-muted-foreground">
                Scans in last 30 days: {ticketFrequency}
              </p>
              {walletRecommendation && (
                <p className="text-body-sm text-muted-foreground">
                  {walletRecommendation}
                </p>
              )}
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  localStorage.setItem(
                    "navigo_ticket_wallet",
                    JSON.stringify({
                      renewedAt: new Date().toISOString(),
                      recommendation: walletRecommendation,
                      frequency: ticketFrequency,
                    }),
                  );
                  speak("Auto-renew completed. Ticket wallet updated.");
                }}
              >
                Auto-Renew / Get Pass
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
