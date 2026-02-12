// Google Maps API Key - Replace with your own key
export const GOOGLE_MAPS_API_KEY = "AIzaSyCRx83tSynuWANC-HA17yBGiVBImVEhX6Y";

// App configuration
export const APP_NAME = "Navigo";
export const APP_VERSION = "1.0.0";

// Splash screen duration in milliseconds
export const SPLASH_DURATION = 3000;

// Available languages
export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
] as const;

// Transport modes
export const TRANSPORT_MODES = [
  {
    id: "bus",
    name: "Bus",
    icon: "Bus",
    color: "transport-bus",
    description: "City & intercity buses",
    helplines: ["1800-180-1234", "1800-102-9999"],
  },
  {
    id: "airport",
    name: "Airport",
    icon: "Plane",
    color: "transport-airport",
    description: "Flights & airport services",
    helplines: ["1800-180-0011", "1860-233-1407"],
  },
  {
    id: "railway",
    name: "Railway",
    icon: "Train",
    color: "transport-railway",
    description: "Trains & metro rail",
    helplines: ["139", "1800-111-139"],
  },
  {
    id: "taxi",
    name: "Taxi",
    icon: "Car",
    color: "transport-taxi",
    description: "Cabs & ride sharing",
    helplines: ["1800-102-8888", "1800-123-4567"],
  },
  {
    id: "metro",
    name: "Metro",
    icon: "TrainFront",
    color: "transport-metro",
    description: "City metro systems",
    helplines: ["155370", "1800-180-4544"],
  },
] as const;

// Emergency contacts
export const EMERGENCY_CONTACTS = {
  police: { name: "Police", number: "100" },
  ambulance: { name: "Ambulance", number: "102" },
  fire: { name: "Fire", number: "101" },
  womenHelpline: { name: "Women Helpline", number: "1091" },
  childHelpline: { name: "Child Helpline", number: "1098" },
  nationalEmergency: { name: "National Emergency", number: "112" },
  railwayPolice: { name: "Railway Police", number: "182" },
  roadAccident: { name: "Road Accident", number: "1073" },
};

// Haptic patterns for navigation (vibration in ms)
export const HAPTIC_PATTERNS = {
  left: [100], // Single short buzz
  right: [100, 50, 100], // Two short buzzes
  straight: [200], // One long buzz
  arrival: [100, 50, 100, 50, 100], // Three buzzes
  alert: [300, 100, 300], // Warning pattern
  emergency: [500, 200, 500, 200, 500], // SOS pattern
};

// Default user preferences
export const DEFAULT_PREFERENCES = {
  language: "en",
  hapticMode: false,
  highContrast: false,
  darkMode: true,
};
