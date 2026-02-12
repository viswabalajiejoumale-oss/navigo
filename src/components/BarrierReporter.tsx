import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportBarrier } from "@/lib/api";

const ISSUE_OPTIONS = [
  { value: "lift_broken", label: "Lift Broken" },
  { value: "ramp_blocked", label: "Ramp Blocked" },
  { value: "escalator_down", label: "Escalator Down" },
];

export default function BarrierReporter() {
  const [issueType, setIssueType] = useState(ISSUE_OPTIONS[0].value);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      if (!navigator.geolocation) {
        setError("Geolocation not supported.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await reportBarrier({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            type: issueType,
          });
          setStatus("Report submitted. Thank you.");
        },
        () => {
          setError("Location permission denied.");
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
    } catch {
      setError("Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barrier Reporting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="text-body-sm text-muted-foreground" htmlFor="barrier-issue">
          Issue type
        </label>
        <select
          id="barrier-issue"
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-body-sm"
          aria-label="Select barrier issue"
        >
          {ISSUE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          aria-label="Submit barrier report"
          className="w-full"
        >
          {submitting ? "Submitting..." : "Report Issue"}
        </Button>
        {status && <p className="text-body-sm text-success">{status}</p>}
        {error && <p className="text-body-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
