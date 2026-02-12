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
  const [result, setResult] = useState<{ explanation: string; status: 'ongoing' | 'expired' | 'unknown' } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    let transportType = 'bus';
    if (lowerText.includes('train') || lowerText.includes('railway')) transportType = 'train';
    else if (lowerText.includes('flight') || lowerText.includes('airport') || lowerText.includes('plane')) transportType = 'flight';
    else if (lowerText.includes('metro') || lowerText.includes('subway')) transportType = 'metro';
    
    // Try to extract origin, destination, platform from natural text
    const originMatch = explanation.match(/(?:origin|from)[:\s]+([A-Za-z\s]+?)(?:destination|to|\n|,)/i);
    const destMatch = explanation.match(/(?:destination|to)[:\s]+([A-Za-z\s]+?)(?:\n|,|\.|\)|platform)/i);
    const platformMatch = explanation.match(/(?:platform|gate)[:\s#]*(\w+)/i);
    const timeMatch = explanation.match(/(\d{1,2}[:\s]?\d{2}\s*(?:AM|PM)?|\d{4}-\d{2}-\d{2})/i);
    
    // Determine status from explanation text
    let status: 'ongoing' | 'expired' | 'unknown' = 'unknown';
    if (lowerText.includes('expired') || lowerText.includes('not valid') || lowerText.includes('past')) {
      status = 'expired';
    } else if (lowerText.includes('valid') || lowerText.includes('ongoing') || lowerText.includes('active')) {
      status = 'ongoing';
    }
    
    return {
      origin: originMatch?.[1]?.trim() || '',
      destination: destMatch?.[1]?.trim() || '',
      time: timeMatch?.[0]?.trim() || '',
      transportType,
      platform: platformMatch?.[1]?.trim() || '',
      status
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
      const explanation = resp.raw || '';
      
      if (!explanation) {
        setError("Could not read ticket.");
        return;
      }

      const parsed = parseTicketInfo(explanation);
      
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

      const spokenPlatform = parsed.platform ? `Platform ${parsed.platform}` : "the platform";
      const spokenDestination = parsed.destination || "your destination";
      const statusMessage = parsed.status === 'expired' ? 'Warning: This ticket has expired.' : 'Ticket is valid.';
      speak(`${statusMessage} Navigating to ${spokenPlatform} for ${spokenDestination}.`);

      setResult({ explanation, status: parsed.status });
    } catch (err: any) {
      if (err?.response?.status === 401) {
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
              <p className="text-body-sm text-muted-foreground">Camera is off</p>
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
                  result.status === 'ongoing'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : result.status === 'expired'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {result.status === 'ongoing' ? '✓ Valid' : result.status === 'expired' ? '✗ Expired' : '? Unknown'}
              </span>
            </div>
            <p className="text-body-sm whitespace-pre-wrap leading-relaxed">
              {result.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
