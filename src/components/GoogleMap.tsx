import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

type Props = {
  apiKey?: string;
  onMapReady?: (m: any) => void;
  enableDistance?: boolean;
};

export default function GoogleMap({ apiKey, onMapReady, enableDistance = true }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    const key = apiKey || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined);
    if (!key) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is not set. Google Maps will not load.");
      return;
    }

    let mounted = true;

    loadGoogleMaps(key)
      .then(() => {
        if (!mounted || !mapRef.current) return;

        const defaultCenter = { lat: 37.7749, lng: -122.4194 };

        mapInstance.current = new (window as any).google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          disableDefaultUI: false,
        });

        markerRef.current = new (window as any).google.maps.Marker({
          map: mapInstance.current,
          position: defaultCenter,
          draggable: true,
        });

        // Call onMapReady if provided
        if (onMapReady) onMapReady(mapInstance.current);

        // Try to use Geolocation to center the map
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              mapInstance.current.setCenter(p);
              markerRef.current.setPosition(p);
            },
            () => {
              /* ignore */
            }
          );
        }

        // Create search box (Places Autocomplete)
        const input = document.getElementById("navigo-places-input") as HTMLInputElement | null;
        if (input && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
          const autocomplete = new (window as any).google.maps.places.Autocomplete(input, {
            fields: ["geometry", "name", "formatted_address"],
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;
            const loc = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            mapInstance.current.panTo(loc);
            mapInstance.current.setZoom(15);
            markerRef.current.setPosition(loc);
          });
        }

        if (enableDistance && (window as any).google?.maps?.geometry) {
          mapInstance.current.addListener("click", (event: any) => {
            const position = event.latLng;
            if (!originMarkerRef.current) {
              originMarkerRef.current = new (window as any).google.maps.Marker({
                map: mapInstance.current,
                position,
                label: "A",
              });
              setDistanceKm(null);
              return;
            }

            if (!destinationMarkerRef.current) {
              destinationMarkerRef.current = new (window as any).google.maps.Marker({
                map: mapInstance.current,
                position,
                label: "B",
              });
            } else {
              originMarkerRef.current.setMap(null);
              destinationMarkerRef.current.setMap(null);
              originMarkerRef.current = new (window as any).google.maps.Marker({
                map: mapInstance.current,
                position,
                label: "A",
              });
              destinationMarkerRef.current = null;
              setDistanceKm(null);
              return;
            }

            const g = (window as any).google;
            const distMeters = g.maps.geometry.spherical.computeDistanceBetween(
              originMarkerRef.current.getPosition(),
              destinationMarkerRef.current.getPosition()
            );
            setDistanceKm(Number((distMeters / 1000).toFixed(2)));
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load Google Maps:", err);
      });

    return () => {
      mounted = false;
    };
  }, [apiKey, onMapReady]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute left-4 top-4 z-20">
        <input
          id="navigo-places-input"
          placeholder="Search places"
          className="rounded px-3 py-2 w-72 bg-white/90 border"
        />
      </div>
      {enableDistance && (
        <div className="absolute right-4 top-4 z-20 rounded-xl bg-white/90 border px-3 py-2 shadow-sm">
          <p className="text-xs text-muted-foreground">Distance between points</p>
          <p className="text-sm font-semibold">
            {distanceKm !== null ? `${distanceKm} km` : "Tap two points"}
          </p>
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
