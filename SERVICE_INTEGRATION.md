# Navigo - Service Integration Guide

This document explains how all Google services, AI integrations, and route tracking are configured in the Navigo app.

## 📋 Overview of Integrated Services

1. **Google Maps** - Navigation, Directions, Places Autocomplete
2. **Google Translate** - Multi-language support
3. **OpenRouter AI** - AI-powered chat and response generation
4. **Dialogflow** - Natural language understanding and intent detection
5. **Route Tracking** - Real-time arrival-to-departure journey tracking

---

## 🔑 Environment Variables

All API keys are configured in `.env` file:

```env
# Google Services
VITE_GOOGLE_API_KEY=AIzaSyCRx83tSynuWANC-HA17yBGiVBImVEhX6Y
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCRx83tSynuWANC-HA17yBGiVBImVEhX6Y

# Google Cloud Project
VITE_GOOGLE_PROJECT_ID=navigo-4140f

# AI Services
OPENROUTER_API_KEY=sk-or-v1-REPLACE_ME
OPENROUTER_MODEL=openrouter/auto
VITE_DIALOGFLOW_PROJECT_ID=navigo-4140f

# Optional TTS (external voice responses)
TTS_PROVIDER=voicerss
VOICERSS_API_KEY=your_api_key

# Backend
VITE_API_URL=http://localhost:4000
VITE_API_BASE_URL=http://localhost:4000

# Feature Flags
VITE_ENABLE_ROUTE_TRACKING=true
VITE_ENABLE_DIALOGFLOW=true
```

---

## 🗺️ Google Maps Integration

### Features
- **Real-time Navigation**: Display routes with live updates
- **Places Autocomplete**: Search for destinations
- **Route Directions**: Show turn-by-turn directions
- **Distance & Duration**: Calculate travel metrics
- **Traffic Information**: Display real-time traffic conditions

### Usage
```tsx
import GoogleMap from "@/components/GoogleMap";

<GoogleMap
  apiKey={GOOGLE_MAPS_API_KEY}
  center={{ lat: 12.9716, lng: 77.5946 }}
  zoom={13}
  onMapReady={(map) => console.log("Map ready")}
/>
```

### Components Using Google Maps
- `GoogleMap.tsx` - Base map component
- `RoutePlanner.tsx` - Route planning with directions
- `RouteTracker.tsx` - Live tracking visualization

---

## 🌍 Google Translate Integration

### Features
- **Multi-language Support**: Translate UI to 100+ languages
- **Client-side Translation**: Uses Google Translation API
- **Fallback Support**: Returns original text on API errors

### Usage
```typescript
import { translateText } from "@/lib/api";

// Translate text from English to Spanish
const spanish = await translateText("Hello", "es", "en");
```

### Components Using Translation
- `LanguageSelection.tsx` - Select and apply language
- `translate.ts` - Core translation library

### Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Hindi (hi)
- Tamil (ta)
- Kannada (kn)
- Telugu (te)
- And 90+ more languages

---

## 🤖 OpenRouter AI Integration

### Features
- **Travel Q&A**: Natural language travel guidance
- **Contextual Responses**: AI-powered replies with action tags
- **Multi-language Support**: Replies match user language
- **Optional TTS**: External voice response when configured

### Backend Endpoint
```
POST /assistant
Body: { text: string, language?: string, userProfile?: object, currentTransportMode?: string, expenses?: array, appContext?: object }
Response: { response: string, configured: boolean }
```

### Usage
```typescript
import { assistantQuery } from "@/lib/api";

const response = await assistantQuery({
  text: "What are the best transit options?",
  language: "en"
});
```

### Optional TTS Endpoint
```
POST /tts
Body: { text: string, language?: string }
Response: audio/mpeg (when configured)
```

---

## 💬 Dialogflow Integration

### Features
- **Intent Recognition**: Understand user intents
- **Entity Extraction**: Parse meaningful entities
- **Confidence Scoring**: Know how confident the AI is
- **Multi-language Support**: Support different languages

### Backend Endpoint
```
POST /dialogflow
Body: { text: string, sessionId?: string, languageCode?: string }
Response: { response: string, intent: string, confidence: number }
```

### Usage
```typescript
import { queryDialogflow, queryDialogflowWithLang } from "@/lib/api";

// Query with English
const result = await queryDialogflow("Book an ambulance");

// Query with specific language
const resultInHindi = await queryDialogflowWithLang("डॉक्टर खोजें", "hi-IN");
```

### Intents Supported
- Emergency Request
- Route Planning
- General Questions
- Accessibility Requests
- Language Selection

---

## 📍 Route Tracking (Arrival to Departure)

### Features
- **Real-time GPS Tracking**: Track journey from origin to destination
- **Waypoint Recording**: Record all location points
- **Distance Calculation**: Calculate total distance traveled
- **Duration Tracking**: Record total travel time
- **Polyline Visualization**: Show route path on map

### API Endpoints

#### Start Tracking
```
POST /routes/start
Body: {
  origin: string,
  destination: string,
  userId: string,
  transportMode: string
}
Response: {
  trackId: string,
  track: RouteTrack
}
```

#### Update Location
```
POST /routes/:trackId/update
Body: {
  lat: number,
  lng: number,
  distance?: number,
  duration?: number
}
Response: { trackId: string, track: RouteTrack }
```

#### End Tracking
```
POST /routes/:trackId/end
Body: {
  lat: number,
  lng: number,
  actualDistance?: number,
  actualDuration?: number,
  notes?: string
}
Response: { trackId: string, track: RouteTrack }
```

#### Get Track
```
GET /routes/:trackId
Response: RouteTrack
```

#### Get User Tracks
```
GET /routes/user/:userId
Response: {
  userId: string,
  count: number,
  tracks: RouteTrack[]
}
```

### Usage
```typescript
import {
  startRouteTracking,
  updateRouteLocation,
  endRouteTracking,
  getRouteTrack
} from "@/lib/api";

// Start tracking
const { trackId } = await startRouteTracking(
  "Origin Address",
  "Destination Address",
  "user123",
  "taxi"
);

// Update location periodically (automatic in RouteTracker component)
await updateRouteLocation(trackId, 12.9716, 77.5946);

// End tracking
await endRouteTracking(
  trackId,
  12.9798,
  77.6009,
  5200, // distance in meters
  420   // duration in seconds
);

// Retrieve tracking data
const track = await getRouteTrack(trackId);
```

### RouteTracker Component
```tsx
import RouteTracker from "@/components/RouteTracker";

<RouteTracker
  origin="Station Road"
  destination="Tech Park"
  userId="user123"
  transportMode="taxi"
  map={mapInstance}
  onTrackingStart={(trackId) => console.log("Started:", trackId)}
  onTrackingEnd={(track) => console.log("Completed:", track)}
/>
```

### Data Structure
```typescript
interface RouteTrack {
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
  waypoints: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    distance: number;
    duration: number;
  }>;
  status: 'started' | 'active' | 'completed';
}
```

---

## 🚀 Running the Application

### Frontend
```bash
# Install dependencies
npm install

# Set environment variables in .env
# Start dev server
npm run dev
```

### Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set environment variables in .env or system
export DIALOGFLOW_PROJECT_ID=navigo-4140f
export OPENROUTER_API_KEY=your_api_key
export VITE_GOOGLE_API_KEY=your_api_key

# Start backend
npm start
```

### Verify Services
```bash
# Check backend health
curl http://localhost:4000/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-02-10T10:30:00.000Z",
#   "services": {
#     "dialogflow": true,
#     "assistant": true,
#     "translate": true,
#     "routeTracking": true
#   }
# }
```

---

## 🔧 Configuration

### Google Cloud Console Setup

1. **Enable APIs**
  - Cloud Translation API
  - Dialogflow API
  - Maps JavaScript API
  - Maps Services

2. **Create API Keys**
   - Go to APIs & Services → Credentials
   - Create an API key
   - Restrict to your application domain
   - Copy key to `.env`

3. **Configure Billing**
   - All Google APIs require billing to be enabled
   - Set up billing account in Google Cloud Console

4. **Create Dialogflow Agent**
   - Go to Dialogflow Console
   - Create new agent for navigo-4140f
   - Train with intents (already configured)

---

## 📊 Usage Examples

### Complete Route Planning Flow
```tsx
import RoutePlanner from "@/components/RoutePlanner";
import RouteTracker from "@/components/RouteTracker";

export function TravelFlow() {
  const [track, setTrack] = useState(null);

  return (
    <div>
      {/* Step 1: Plan route */}
      <RoutePlanner apiKey={GOOGLE_MAPS_API_KEY} />

      {/* Step 2: Track journey */}
      {track && (
        <RouteTracker
          origin={track.origin}
          destination={track.destination}
          userId="user123"
          transportMode={track.mode}
          onTrackingEnd={(completedTrack) => {
            console.log(`Journey completed: ${completedTrack.distance}m`);
          }}
        />
      )}
    </div>
  );
}
```

### AI Assistant Example
```tsx
import { assistantQuery, queryDialogflow } from "@/lib/api";

async function handleUserQuery(query: string) {
  // Try Dialogflow first for structured intents
  const dialogflowResult = await queryDialogflow(query);

  // If not matched, use OpenRouter for free-form responses
  if (!dialogflowResult) {
    const assistantResult = await assistantQuery({ text: query });
    return assistantResult;
  }

  return dialogflowResult;
}
```

---

## 🐛 Troubleshooting

### API Key Errors
- Ensure API keys are correct in `.env`
- Check that billing is enabled in Google Cloud Console
- Verify API restrictions allow your domain

### Geolocation Not Working
- Ensure HTTPS (or localhost for dev)
- Request user permission
- Check browser location services are enabled

### Translation API Blocked
- Enable Cloud Translation API in Google Cloud Console
- Check API key restrictions
- Verify billing is enabled

### Dialogflow Not Responding
- Check DIALOGFLOW_PROJECT_ID matches your project
- Verify service account JSON is valid
- Check Dialogflow agent is deployed

### Backend Connection Issues
- Ensure backend is running on port 4000
- Check VITE_API_URL in .env matches backend
- Verify CORS is enabled (it is by default)

---

## 📚 Additional Resources

- [Google Maps Documentation](https://developers.google.com/maps)
- [Google Cloud Translation](https://cloud.google.com/translate/docs)
- [OpenRouter](https://openrouter.ai/)
- [Dialogflow Documentation](https://cloud.google.com/dialogflow/docs)

---

## ✅ Integration Checklist

- [ ] All API keys added to `.env`
- [ ] Backend `.env` configured with service keys
- [ ] Google Cloud APIs enabled
- [ ] Billing enabled for all APIs
- [ ] Dialogflow agent created and deployed
- [ ] Backend running on port 4000
- [ ] Frontend connects to backend successfully
- [ ] Route tracking geolocation permissions granted
- [ ] Translation API working
- [ ] OpenRouter assistant responds to queries
- [ ] Dialogflow intents recognized
