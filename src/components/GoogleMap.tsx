import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { DEMO_TRANSPORTS } from "@/lib/constants";

type Props = {
  apiKey?: string;
  onMapReady?: (m: any) => void;
  enableDistance?: boolean;
  showDemoTransports?: boolean;
};

export default function GoogleMap({ apiKey, onMapReady, enableDistance = true, showDemoTransports = true }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const demoMarkersRef = useRef<any[]>([]);
  const routeLinesRef = useRef<any[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null);

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

        // Add demo transport markers (limit to 100 for performance)
        if (showDemoTransports) {
          const visibleTransports = DEMO_TRANSPORTS.slice(0, 100);
          visibleTransports.forEach((transport) => {
            // Get transport symbol
            const getSymbol = (type: string) => {
              const symbols: any = {
                bus: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', scale: 1.5, fillColor: transport.color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
                train: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', scale: 1.5, fillColor: transport.color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
                metro: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', scale: 1.5, fillColor: transport.color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
                airplane: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', scale: 1.5, fillColor: transport.color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
                taxi: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', scale: 1.5, fillColor: transport.color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
              };
              return symbols[type] || symbols.bus;
            };

            const marker = new (window as any).google.maps.Marker({
              map: mapInstance.current,
              position: transport.start,
              title: `${transport.name} - ${transport.route}`,
              icon: getSymbol(transport.type),
              animation: (window as any).google.maps.Animation.DROP,
            });

            const infoWindow = new (window as any).google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; max-width: 260px; animation: fadeIn 0.3s ease-in;">
                  <h3 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #1e3a8a; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${transport.name}</h3>
                  <p style="margin: 5px 0; font-size: 13px; color: #1e40af;"><strong style="color: #1e3a8a;">Route:</strong> ${transport.route}</p>
                  <p style="margin: 5px 0; font-size: 13px; color: #1e40af;"><strong style="color: #1e3a8a;">Start Time:</strong> ${transport.startTime}</p>
                  <p style="margin: 5px 0; font-size: 13px; color: #1e40af;"><strong style="color: #1e3a8a;">Fare:</strong> ${transport.fare}</p>
                  <div style="margin-top: 10px; border-top: 2px solid #dbeafe; padding-top: 8px;">
                    <p style="margin: 4px 0; font-size: 12px; font-weight: 700; color: #1e3a8a;">Stops:</p>
                    ${transport.stops.map((stop: any) => `<p style="margin: 3px 0; font-size: 11px; color: #1e40af;">📍 ${stop.name} - <span style="color: #1e3a8a; font-weight: 600;">${stop.time}</span></p>`).join('')}
                  </div>
                </div>
                <style>
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                </style>
              `,
            });

            marker.addListener("click", () => {
              demoMarkersRef.current.forEach((m: any) => m.infoWindow?.close());
              infoWindow.open(mapInstance.current, marker);
              setSelectedTransport(transport);
              setSelectedTransportId(transport.id);
              
              // Highlight selected route by making it darker
              routeLinesRef.current.forEach((routeData: any) => {
                if (routeData.id === transport.id) {
                  routeData.polyline.setOptions({
                    strokeColor: '#1e3a8a',
                    strokeOpacity: 1,
                    strokeWeight: 6,
                    zIndex: 1000,
                  });
                } else {
                  routeData.polyline.setOptions({
                    strokeColor: routeData.originalColor,
                    strokeOpacity: 0.4,
                    strokeWeight: 2,
                    zIndex: 1,
                  });
                }
              });
            });

            demoMarkersRef.current.push({ marker, infoWindow });

            // Add stop markers
            transport.stops.forEach((stop: any, index: number) => {
              if (index > 0) {
                new (window as any).google.maps.Marker({
                  map: mapInstance.current,
                  position: { lat: stop.lat, lng: stop.lng },
                  icon: {
                    path: (window as any).google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: transport.color,
                    fillOpacity: 0.6,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  },
                  title: `${stop.name} - ${stop.time}`,
                });
              }
            });

            // Draw route line
            const routePath = transport.stops.map((stop: any) => ({ lat: stop.lat, lng: stop.lng }));
            const polyline = new (window as any).google.maps.Polyline({
              path: routePath,
              geodesic: true,
              strokeColor: transport.color,
              strokeOpacity: 0.6,
              strokeWeight: 3,
              map: mapInstance.current,
              zIndex: 1,
            });
            
            routeLinesRef.current.push({
              id: transport.id,
              polyline,
              originalColor: transport.color,
            });
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
          className="rounded px-3 py-2 w-72 bg-white/90 border-2 border-blue-200 text-blue-900 font-semibold placeholder:text-blue-600 placeholder:font-normal focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-all"
        />
      </div>
      {enableDistance && (
        <div className="absolute right-4 top-4 z-20 rounded-xl bg-white/95 border-2 border-blue-200 px-3 py-2 shadow-lg">
          <p className="text-xs text-blue-700 font-semibold">Distance between points</p>
          <p className="text-sm font-bold text-blue-900">
            {distanceKm !== null ? `${distanceKm} km` : "Tap two points"}
          </p>
        </div>
      )}
      {selectedTransport && (
        <div className="absolute left-4 bottom-4 z-20 rounded-xl bg-white/95 border-2 border-blue-900 px-4 py-3 shadow-xl max-w-sm animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-base text-blue-900 animate-in fade-in duration-500">
              {selectedTransport.name}
            </h4>
            <button
              onClick={() => {
                setSelectedTransport(null);
                setSelectedTransportId(null);
                // Reset all route lines to default
                routeLinesRef.current.forEach((routeData: any) => {
                  routeData.polyline.setOptions({
                    strokeColor: routeData.originalColor,
                    strokeOpacity: 0.6,
                    strokeWeight: 3,
                    zIndex: 1,
                  });
                });
              }}
              className="text-blue-900 hover:text-blue-700 text-xl leading-none font-bold transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-blue-800 mb-1 font-semibold">📍 {selectedTransport.route}</p>
          <p className="text-xs text-blue-700 mb-1">🕐 Starts: <span className="font-semibold text-blue-900">{selectedTransport.startTime}</span></p>
          <p className="text-xs font-bold text-green-700 mt-2">💰 {selectedTransport.fare}</p>
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
