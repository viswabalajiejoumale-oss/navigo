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

// Tamil Nadu & Puducherry locations database
const TN_LOCATIONS = [
  { name: "Puducherry Beach", lat: 11.9416, lng: 79.8083 },
  { name: "Auroville", lat: 12.0051, lng: 79.8104 },
  { name: "Paradise Beach", lat: 11.9297, lng: 79.8381 },
  { name: "Promenade Beach", lat: 11.9270, lng: 79.8312 },
  { name: "Botanical Garden Pondy", lat: 11.9342, lng: 79.8306 },
  { name: "Chennai Central", lat: 13.0827, lng: 80.2707 },
  { name: "Marina Beach", lat: 13.0499, lng: 80.2824 },
  { name: "T Nagar", lat: 13.0418, lng: 80.2341 },
  { name: "Egmore", lat: 13.0732, lng: 80.2609 },
  { name: "Velachery", lat: 12.9750, lng: 80.2210 },
  { name: "Tambaram", lat: 12.9249, lng: 80.1000 },
  { name: "Chennai Airport", lat: 12.9941, lng: 80.1709 },
  { name: "Madurai Junction", lat: 9.9252, lng: 78.1198 },
  { name: "Meenakshi Temple", lat: 9.9195, lng: 78.1193 },
  { name: "Thirumalai Nayak Palace", lat: 9.9177, lng: 78.1212 },
  { name: "Madurai Airport", lat: 9.8345, lng: 78.0934 },
  { name: "Coimbatore Junction", lat: 11.0168, lng: 76.9558 },
  { name: "Gandhipuram", lat: 11.0175, lng: 76.9671 },
  { name: "RS Puram", lat: 11.0038, lng: 76.9575 },
  { name: "Coimbatore Airport", lat: 11.0300, lng: 77.0434 },
  { name: "Trichy Junction", lat: 10.8155, lng: 78.6869 },
  { name: "Rock Fort Temple", lat: 10.8270, lng: 78.6897 },
  { name: "Srirangam", lat: 10.8667, lng: 78.6833 },
  { name: "Trichy Airport", lat: 10.7654, lng: 78.7097 },
  { name: "Salem Junction", lat: 11.6643, lng: 78.1460 },
  { name: "Salem Airport", lat: 11.7833, lng: 78.0656 },
  { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 },
  { name: "Erode Junction", lat: 11.3410, lng: 77.7172 },
  { name: "Vellore Fort", lat: 12.9165, lng: 79.1325 },
  { name: "Vellore VIT", lat: 12.9692, lng: 79.1559 },
  { name: "Thoothukudi Port", lat: 8.8088, lng: 78.1350 },
  { name: "Thanjavur Palace", lat: 10.7870, lng: 79.1378 },
  { name: "Dindigul Fort", lat: 10.3624, lng: 77.9694 },
  { name: "Karur Town", lat: 10.9601, lng: 78.0766 },
  { name: "Cuddalore Port", lat: 11.7480, lng: 79.7714 },
  { name: "Villupuram Junction", lat: 11.9401, lng: 79.4861 },
  { name: "Kanyakumari", lat: 8.0883, lng: 77.5385 },
  { name: "Rameswaram", lat: 9.2876, lng: 79.3129 },
  { name: "Ooty Lake", lat: 11.4064, lng: 76.6932 },
  { name: "Kodaikanal", lat: 10.2381, lng: 77.4892 },
  { name: "Yercaud", lat: 11.7765, lng: 78.2036 },
  { name: "Mahabalipuram", lat: 12.6269, lng: 80.1928 },
  { name: "Kanchipuram", lat: 12.8342, lng: 79.7036 },
  { name: "Chidambaram", lat: 11.3990, lng: 79.6914 },
  { name: "Kumbakonam", lat: 10.9617, lng: 79.3881 },
  { name: "Nagercoil", lat: 8.1742, lng: 77.4337 },
  { name: "Hosur", lat: 12.7409, lng: 77.8253 },
  { name: "Tirupur", lat: 11.1085, lng: 77.3411 },
  { name: "Namakkal", lat: 11.2189, lng: 78.1677 },
  { name: "Pollachi", lat: 10.6586, lng: 77.0085 },
];

// Generate demo transports programmatically
function generateDemoTransports() {
  const transports: any[] = [];
  const colors = ["#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#FFD93D", "#A8E6CF", "#FF8B94", "#FFD3B6", "#FFAAA5", "#AA96DA"];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate 300 buses
  for (let i = 1; i <= 300; i++) {
    const start = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    let dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    while (dest.name === start.name) {
      dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    }
    
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const stops = [
      { ...start, time: startTime },
      { lat: (start.lat + dest.lat) / 2, lng: (start.lng + dest.lng) / 2, name: "Mid Stop", time: `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` },
      { ...dest, time: `${(hour + 2).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` },
    ];
    
    transports.push({
      id: `bus-${i}`,
      type: "bus",
      name: `TN Bus ${i}`,
      route: `${start.name} → ${dest.name}`,
      start,
      destination: dest,
      stops,
      startTime,
      fare: "Free Demo",
      color: colors[i % colors.length],
    });
  }
  
  // Generate 200 trains
  for (let i = 1; i <= 200; i++) {
    const start = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    let dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    while (dest.name === start.name) {
      dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    }
    
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const stops = [
      { ...start, time: startTime },
      { ...dest, time: `${(hour + 3).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` },
    ];
    
    transports.push({
      id: `train-${i}`,
      type: "train",
      name: `TN Express ${i}`,
      route: `${start.name} → ${dest.name}`,
      start,
      destination: dest,
      stops,
      startTime,
      fare: "Free Demo",
      color: colors[i % colors.length],
    });
  }
  
  // Generate 100 metros
  for (let i = 1; i <= 100; i++) {
    const start = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    let dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    while (dest.name === start.name) {
      dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    }
    
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const stops = [
      { ...start, time: startTime },
      { lat: (start.lat + dest.lat) / 2, lng: (start.lng + dest.lng) / 2, name: "Metro Junction", time: `${hour.toString().padStart(2, '0')}:${(minute + 10).toString().padStart(2, '0')}` },
      { ...dest, time: `${hour.toString().padStart(2, '0')}:${(minute + 20).toString().padStart(2, '0')}` },
    ];
    
    transports.push({
      id: `metro-${i}`,
      type: "metro",
      name: `Metro Line ${i}`,
      route: `${start.name} → ${dest.name}`,
      start,
      destination: dest,
      stops,
      startTime,
      fare: "Free Demo",
      color: colors[i % colors.length],
    });
  }
  
  // Generate 50 flights
  for (let i = 1; i <= 50; i++) {
    const airports = TN_LOCATIONS.filter(loc => loc.name.includes("Airport"));
    const start = airports[Math.floor(Math.random() * airports.length)];
    let dest = airports[Math.floor(Math.random() * airports.length)];
    while (dest.name === start.name) {
      dest = airports[Math.floor(Math.random() * airports.length)];
    }
    
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = [0, 30][Math.floor(Math.random() * 2)];
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const stops = [
      { ...start, time: startTime },
      { ...dest, time: `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` },
    ];
    
    transports.push({
      id: `flight-${i}`,
      type: "airplane",
      name: `Flight TN${i}`,
      route: `${start.name} → ${dest.name}`,
      start,
      destination: dest,
      stops,
      startTime,
      fare: "Free Demo",
      color: colors[i % colors.length],
    });
  }
  
  // Generate 350 taxis
  for (let i = 1; i <= 350; i++) {
    const start = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    let dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    while (dest.name === start.name) {
      dest = TN_LOCATIONS[Math.floor(Math.random() * TN_LOCATIONS.length)];
    }
    
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = Math.floor(Math.random() * 60);
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const stops = [
      { ...start, time: startTime },
      { ...dest, time: `${hour.toString().padStart(2, '0')}:${(minute + 30).toString().padStart(2, '0')}` },
    ];
    
    transports.push({
      id: `taxi-${i}`,
      type: "taxi",
      name: `Taxi ${i}`,
      route: `${start.name} → ${dest.name}`,
      start,
      destination: dest,
      stops,
      startTime,
      fare: "Free Demo",
      color: colors[i % colors.length],
    });
  }
  
  return transports;
}

// Demo transport markers for map display (1000 generated, but only 100 shown at once for performance)
// Click on a transport to highlight its route with a darker blue line
export const DEMO_TRANSPORTS = generateDemoTransports();
