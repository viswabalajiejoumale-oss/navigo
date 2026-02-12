import React, { useState, useEffect, useRef } from "react";
import { startRouteTracking, updateRouteLocation, endRouteTracking, RouteTrack } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, MapPin, Navigation, Check } from "lucide-react";

interface RouteTrackerProps {
  origin: string;
  destination: string;
  userId: string;
  transportMode: string;
  map?: any;
  onTrackingStart?: (trackId: string) => void;
  onTrackingEnd?: (track: RouteTrack) => void;
}

export default function RouteTracker({
  origin,
  destination,
  userId,
  transportMode,
  map,
  onTrackingStart,
  onTrackingEnd,
}: RouteTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [track, setTrack] = useState<RouteTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const markerRef = useRef<any | null>(null);
  const polylineRef = useRef<any | null>(null);

  // Start tracking
  const handleStartTracking = async () => {
    try {
      setError(null);
      const result = await startRouteTracking(origin, destination, userId, transportMode);
      setTrackId(result.trackId);
      setTrack(result.track);
      setIsTracking(true);
      onTrackingStart?.(result.trackId);

      // Start periodic location updates
      if ("geolocation" in navigator) {
        trackingIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const updated = await updateRouteLocation(result.trackId, latitude, longitude);
                setTrack(updated.track);

                // Update marker on map
                if (map && markerRef.current) {
                  markerRef.current.setPosition(new google.maps.LatLng(latitude, longitude));
                  map.panTo(markerRef.current.getPosition()!);
                }

                // Update polyline
                if (map && polylineRef.current && updated.track.waypoints) {
                  const path = updated.track.waypoints.map(
                    (w) => new google.maps.LatLng(w.lat, w.lng)
                  );
                  polylineRef.current.setPath(path);
                }
              } catch (e) {
                console.error("Failed to update route location:", e);
              }
            },
            (err) => {
              console.error("Geolocation error:", err);
            }
          );
        }, 10000); // Update every 10 seconds
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start tracking");
      console.error("Start tracking error:", err);
    }
  };

  // End tracking
  const handleEndTracking = async () => {
    try {
      if (!trackId) return;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const result = await endRouteTracking(trackId, latitude, longitude);
              setTrack(result.track);
              setIsTracking(false);
              onTrackingEnd?.(result.track);

              // Clean up interval
              if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
              }

              // Remove markers and polylines
              if (markerRef.current) markerRef.current.setMap(null);
              if (polylineRef.current) polylineRef.current.setMap(null);
            } catch (e) {
              setError((e as any)?.message || "Failed to end tracking");
            }
          },
          (err) => {
            setError("Could not get current location");
            console.error("Geolocation error:", err);
          }
        );
      }
    } catch (err: any) {
      setError(err?.message || "Failed to end tracking");
      console.error("End tracking error:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Initialize markers and polyline
  useEffect(() => {
    if (!map || !isTracking) return;

    // Create starting marker
    markerRef.current = new google.maps.Marker({
      position: map.getCenter(),
      map,
      title: "Current Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });

    // Create polyline for route path
    polylineRef.current = new google.maps.Polyline({
      map,
      strokeColor: "#1f2937",
      strokeWeight: 3,
      strokeOpacity: 0.7,
      path: [],
    });

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, isTracking]);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Route Tracking</h3>
          </div>

          {/* Status */}
          {track && (
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={track.status === "completed" ? "text-success" : "text-primary"}>
                  {track.status === "completed" ? "✓ Completed" : "● Active"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium">{(track.distance / 1000).toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{Math.round(track.duration / 60)} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waypoints:</span>
                <span className="font-medium">{track.waypoints.length}</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!isTracking ? (
              <Button
                onClick={handleStartTracking}
                className="flex-1 gap-2"
                variant="default"
              >
                <MapPin className="h-4 w-4" />
                Start Tracking
              </Button>
            ) : (
              <Button
                onClick={handleEndTracking}
                className="flex-1 gap-2"
                variant="destructive"
              >
                <Check className="h-4 w-4" />
                Stop Tracking
              </Button>
            )}
          </div>

          {/* Track Info */}
          {trackId && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              <p>Track ID: <code>{trackId}</code></p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
