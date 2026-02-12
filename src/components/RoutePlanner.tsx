import React, { useEffect, useRef, useState } from "react";
import GoogleMap from "@/components/GoogleMap";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { useTranslation } from "@/hooks/useTranslation";

type LatLng = { lat: number; lng: number };

const DEFAULT_RATES = { base: 20, perKm: 10, perMin: 1 }; // INR example

async function fetchAQ(lat: number, lng: number) {
  try {
    // Use OpenAQ to get nearest measurement
    const res = await fetch(
      `https://api.openaq.org/v2/latest?coordinates=${lat},${lng}&radius=5000&limit=1`
    );
    const json = await res.json();
    if (json && json.results && json.results.length) {
      const m = json.results[0].measurements;
      // prefer pm25
      const pm25 = m.find((x: any) => x.parameter === "pm25");
      const val = pm25 || m[0];
      return { parameter: val.parameter, value: val.value, unit: val.unit, location: json.results[0].location };
    }
    return null;
  } catch (e) {
    console.warn("AQ fetch failed", e);
    return null;
  }
}

export default function RoutePlanner({ apiKey }: { apiKey?: string }) {
  const { t } = useTranslation();
  const [map, setMap] = useState<any | null>(null);
  const originRef = useRef<HTMLInputElement | null>(null);
  const destRef = useRef<HTMLInputElement | null>(null);
  const directionsRendererRef = useRef<any | null>(null);
  const [info, setInfo] = useState<{
    distanceKm?: number;
    durationMin?: number;
    durationTrafficMin?: number | null;
    cost?: number;
    aqi?: string | null;
  }>({});
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState(DEFAULT_RATES);

  useEffect(() => {
    if (!apiKey) return;
    let mounted = true;
    (async () => {
      try {
        await loadGoogleMaps(apiKey);
        if (!mounted) return;
        // initialize autocomplete on inputs (only bind to map when available)
        if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
          if (originRef.current) {
            const ac = new (window as any).google.maps.places.Autocomplete(originRef.current);
            if (map) ac.bindTo("bounds", map);
          }
          if (destRef.current) {
            const ac2 = new (window as any).google.maps.places.Autocomplete(destRef.current);
            if (map) ac2.bindTo("bounds", map);
          }
        }
      } catch (e) {
        console.warn("Failed to load maps for route planner", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiKey, map]);

  const onMapReady = (m: any) => {
    setMap(m);
    directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({ suppressMarkers: false });
    directionsRendererRef.current.setMap(m);
  };

  const computeRoute = async () => {
    if (!map) return;
    const origin = originRef.current?.value;
    const destination = destRef.current?.value;
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const ds = new (window as any).google.maps.DirectionsService();
      const req: any = {
        origin,
        destination,
        travelMode: (window as any).google.maps.TravelMode.DRIVING,
        drivingOptions: { departureTime: new Date() },
        unitSystem: (window as any).google.maps.UnitSystem.METRIC,
      };

      // Wrap callback-style route() in a Promise to await it
      const result: any = await new Promise((resolve, reject) => {
        ds.route(req, (res: any, status: string) => {
          if (status === "OK") resolve(res);
          else reject(new Error(`Directions request failed: ${status}`));
        });
      });

      if (directionsRendererRef.current) directionsRendererRef.current.setDirections(result);

      // aggregate distance and duration
      let distMeters = 0;
      let durSec = 0;
      let durTrafficSec: number | null = null;
      const route = result.routes[0];
      for (const leg of route.legs) {
        distMeters += leg.distance?.value || 0;
        durSec += leg.duration?.value || 0;
        if (leg.duration_in_traffic && leg.duration_in_traffic.value) {
          durTrafficSec = (durTrafficSec || 0) + leg.duration_in_traffic.value;
        }
      }
      const distanceKm = +(distMeters / 1000).toFixed(2);
      const durationMin = Math.round(durSec / 60);
      const durationTrafficMin = durTrafficSec ? Math.round(durTrafficSec / 60) : null;

      // compute cost
      const cost = Math.round((rates.base + rates.perKm * distanceKm + rates.perMin * (durationTrafficMin ?? durationMin)));

      // compute midpoint for AQ: take middle of route overview_path
      let midpoint: LatLng | null = null;
      if (route.overview_path && route.overview_path.length) {
        const pts = route.overview_path;
        const midIdx = Math.floor(pts.length / 2);
        midpoint = { lat: pts[midIdx].lat(), lng: pts[midIdx].lng() };
      } else if (route.legs && route.legs[0]) {
        midpoint = { lat: route.legs[0].start_location.lat(), lng: route.legs[0].start_location.lng() };
      }

      let aqiString: string | null = null;
      if (midpoint) {
        const a = await fetchAQ(midpoint.lat, midpoint.lng);
        if (a) aqiString = `${a.parameter.toUpperCase()}: ${a.value} ${a.unit} @ ${a.location}`;
      }

      setInfo({ distanceKm, durationMin, durationTrafficMin, cost, aqi: aqiString });

      // center map to route bounds
      const bounds = new (window as any).google.maps.LatLngBounds();
      for (const leg of route.legs) {
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
      }
      map.fitBounds(bounds);
    } catch (e) {
      console.error("Route compute failed", e);
      alert("Failed to compute route: " + (e as any)?.message || e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="p-3 bg-white/90">
        <div className="flex gap-2 mb-3">
          <input ref={originRef} className="flex-1 rounded-md border px-3 py-2" placeholder="Origin (type or choose)" />
          <input ref={destRef} className="flex-1 rounded-md border px-3 py-2" placeholder="Destination (type or choose)" />
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" onClick={computeRoute} disabled={loading}>
            {loading ? "Calculating..." : "Go"}
          </button>
        </div>
        <div className="flex gap-2 items-center mb-2">
          <label className="text-sm">Base:</label>
          <input className="w-20 rounded-md border px-2 py-1" value={rates.base} onChange={(e)=>setRates({...rates, base: Number(e.target.value)})} />
          <label className="text-sm">/km:</label>
          <input className="w-20 rounded-md border px-2 py-1" value={rates.perKm} onChange={(e)=>setRates({...rates, perKm: Number(e.target.value)})} />
          <label className="text-sm">/min:</label>
          <input className="w-20 rounded-md border px-2 py-1" value={rates.perMin} onChange={(e)=>setRates({...rates, perMin: Number(e.target.value)})} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">Distance</div>
            <div className="text-lg font-semibold">{info.distanceKm ?? "--"} km</div>
          </div>
          <div className="p-2 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="text-lg font-semibold">{info.durationTrafficMin ?? info.durationMin ?? "--"} min</div>
          </div>
          <div className="p-2 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">Est. Cost</div>
            <div className="text-lg font-semibold">₹ {info.cost ?? "--"}</div>
          </div>
          <div className="p-2 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">Air Quality (near route)</div>
            <div className="text-sm">{info.aqi ?? "Unavailable"}</div>
          </div>
        </div>
      </div>
      <div className="h-64">
        <GoogleMap apiKey={apiKey} onMapReady={onMapReady} />
      </div>
    </div>
  );
}
