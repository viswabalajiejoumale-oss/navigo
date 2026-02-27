import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scanSignage, translateText } from "@/lib/api";
import { useApp } from "@/context/AppContext";

const videoConstraints = { facingMode: "environment" };

export default function VoiceSignage() {
  const webcamRef = useRef<Webcam>(null);
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [detectedText, setDetectedText] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleReadSign = async () => {
    setLoading(true);
    setError(null);
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setError("Camera capture failed.");
        return;
      }

      const resp = await scanSignage(imageSrc);
      const raw = resp.raw?.trim() || "No sign text detected.";
      setDetectedText(raw);

      const targetLang = state.language || "en";
      const translated =
        targetLang === "en" ? raw : await translateText(raw, targetLang);
      setSpokenText(translated);
      speak(translated);
    } catch {
      setError("Could not read signage right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice-Signage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative rounded-xl overflow-hidden border">
          {cameraOn ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-44 object-cover"
            />
          ) : (
            <div className="h-44 grid place-items-center bg-muted text-body-sm text-muted-foreground">
              Camera is off
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setCameraOn((prev) => !prev)}
          >
            {cameraOn ? "Camera Off" : "Camera On"}
          </Button>
          <Button onClick={handleReadSign} disabled={!cameraOn || loading}>
            {loading ? "Reading..." : "Read Sign"}
          </Button>
        </div>

        {error && <p className="text-body-sm text-destructive">{error}</p>}

        {detectedText && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-body-xs text-muted-foreground">Detected text</p>
            <p className="text-body-sm">{detectedText}</p>
            {spokenText && (
              <>
                <p className="text-body-xs text-muted-foreground">
                  Spoken output
                </p>
                <p className="text-body-sm">{spokenText}</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
