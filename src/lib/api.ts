import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface AmbulanceAdminDto {
  id: string;
  ownerName: string;
  licenseNumber: string;
  ambulanceNumber: string;
  vehicleType: string;
  contact: string;
  available: boolean;
}

export interface UserProfileDto {
  id?: string;
  name: string;
  age?: string;
  mobilityNeeds?: string;
  preferences?: string;
}

export async function getAmbulances(): Promise<AmbulanceAdminDto[]> {
  const resp = await client.get("/ambulances");
  return resp.data;
}

export async function registerAmbulance(payload: Omit<AmbulanceAdminDto, "id">) {
  const resp = await client.post("/ambulances", payload);
  return resp.data as AmbulanceAdminDto;
}

export async function updateAmbulanceAvailability(id: string, available: boolean) {
  const resp = await client.patch(`/ambulances/${id}`, { available });
  return resp.data as AmbulanceAdminDto;
}

export async function getUserProfile(userId?: string) {
  const resp = await client.get(`/users/${userId || "me"}`);
  return resp.data as UserProfileDto;
}

export async function getExpenses(userId?: string) {
  const resp = await client.get(`/expenses${userId ? `?userId=${userId}` : ""}`);
  return resp.data;
}

export async function addExpense(payload: any) {
  const resp = await client.post(`/expenses`, payload);
  return resp.data;
}

export async function queryDialogflow(text: string) {
  try {
    const resp = await client.post(`/dialogflow`, { text });
    return resp.data?.response || "";
  } catch (e) {
    console.warn("Dialogflow query failed:", e);
    throw e;
  }
}

export async function queryDialogflowWithLang(text: string, languageCode: string) {
  try {
    const resp = await client.post(`/dialogflow`, { text, languageCode });
    return resp.data?.response || "";
  } catch (e) {
    console.warn("Dialogflow query failed:", e);
    throw e;
  }
}

export async function geminiQuery(text: string, language?: string) {
  try {
    const resp = await client.post(`/gemini`, { text, language });
    return resp.data?.response || "";
  } catch (e) {
    console.warn("Gemini query failed:", e);
    throw e;
  }
}

// ============================================================================
// MAPS PLATFORM WRAPPERS
// ============================================================================

export async function geocodeAddress(address: string) {
  const resp = await client.post('/maps/geocode', { address });
  return resp.data;
}

export async function geocodeLatLng(lat: number, lng: number) {
  const resp = await client.post('/maps/geocode', { lat, lng });
  return resp.data;
}

export async function getDirections(origin: string, destination: string, mode?: string) {
  const resp = await client.post('/maps/directions', { origin, destination, mode });
  return resp.data;
}

export async function getDistanceMatrix(origins: string, destinations: string) {
  const resp = await client.post('/maps/distance-matrix', { origins, destinations });
  return resp.data;
}

export async function getAirQuality(lat: number, lng: number) {
  const resp = await client.post('/maps/air-quality', { lat, lng });
  return resp.data;
}

export async function getWeather(lat: number, lng: number) {
  const resp = await client.post('/maps/weather', { lat, lng });
  return resp.data;
}

export async function validateAddress(payload: any) {
  const resp = await client.post('/maps/address-validation', payload);
  return resp.data;
}

// ============================================================================
// GOOGLE TRANSLATE
// ============================================================================

export async function translateText(text: string, targetLanguage: string, sourceLanguage?: string) {
  try {
    const resp = await client.post('/translate', {
      text,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto'
    });
    // If backend indicates translation not configured, fallback below
    if (resp.status === 501 || resp.data?.error) {
      throw new Error('Backend translation not configured');
    }
    return resp.data?.translated || text;
  } catch (e) {
    console.warn("Translation failed via backend, attempting client-side fallback:", e?.message || e);
    // Client-side fallback: if a Vite-provided Google API key is present, call Translate API directly from client
    const clientKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
    if (clientKey) {
      try {
        const body = new URLSearchParams();
        body.append('q', text);
        body.append('target', targetLanguage);
        if (sourceLanguage) body.append('source', sourceLanguage);
        body.append('format', 'text');

        const r = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${clientKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (r.ok) {
          const j = await r.json();
          return j.data?.translations?.[0]?.translatedText || text;
        }
      } catch (err) {
        console.warn('Client-side translate failed:', err);
      }
    }

    return text; // Return original text as final fallback
  }
}

// ============================================================================
// ROUTE TRACKING - ARRIVAL TO DEPARTURE
// ============================================================================

export interface RouteTrack {
  id: string;
  origin: string;
  destination: string;
  userId: string;
  transportMode: string;
  startTime: string;
  startLocation: { lat: number; lng: number } | null;
  currentLocation: { lat: number; lng: number; timestamp: string } | null;
  endLocation: { lat: number; lng: number; timestamp: string } | null;
  endTime: string | null;
  distance: number;
  duration: number;
  waypoints: Array<{ lat: number; lng: number; timestamp: string; distance: number; duration: number }>;
  status: 'started' | 'active' | 'completed';
}

export async function startRouteTracking(
  origin: string,
  destination: string,
  userId: string,
  transportMode: string = 'mixed'
) {
  try {
    const resp = await client.post('/routes/start', {
      origin,
      destination,
      userId,
      transportMode
    });
    return resp.data as { trackId: string; track: RouteTrack };
  } catch (e) {
    console.error("Failed to start route tracking:", e);
    throw e;
  }
}

export async function updateRouteLocation(
  trackId: string,
  lat: number,
  lng: number,
  distance?: number,
  duration?: number
) {
  try {
    const resp = await client.post(`/routes/${trackId}/update`, {
      lat,
      lng,
      distance,
      duration
    });
    return resp.data as { trackId: string; track: RouteTrack };
  } catch (e) {
    console.error("Failed to update route location:", e);
    throw e;
  }
}

export async function endRouteTracking(
  trackId: string,
  lat: number,
  lng: number,
  actualDistance?: number,
  actualDuration?: number,
  notes?: string
) {
  try {
    const resp = await client.post(`/routes/${trackId}/end`, {
      lat,
      lng,
      actualDistance,
      actualDuration,
      notes
    });
    return resp.data as { trackId: string; track: RouteTrack };
  } catch (e) {
    console.error("Failed to end route tracking:", e);
    throw e;
  }
}

export async function getRouteTrack(trackId: string) {
  try {
    const resp = await client.get(`/routes/${trackId}`);
    return resp.data as RouteTrack;
  } catch (e) {
    console.error("Failed to fetch route track:", e);
    throw e;
  }
}

export async function getUserRouteTracks(userId: string) {
  try {
    const resp = await client.get(`/routes/user/${userId}`);
    return resp.data as { userId: string; count: number; tracks: RouteTrack[] };
  } catch (e) {
    console.error("Failed to fetch user route tracks:", e);
    throw e;
  }

}

export default client;
