import React, { createContext, useContext, useReducer, useEffect } from "react";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import { getAmbulances } from "@/lib/api";
import { translatePage, translatePageViaBackend, translatePageWithMap } from "@/lib/translate";

export interface UserProfile {
  name: string;
  age: string;
  mobilityNeeds: string;
  preferences: string;
}

export interface TripDetails {
  origin: string;
  destination: string;
  time: string;
  transportType: string;
  platform: string;
  scannedAt: string;
  status: "ongoing" | "expired" | "unknown";
}

export interface TripExpense {
  id: string;
  mode: string;
  from: string;
  to: string;
  amount: number;
  date: string;
}

export interface AmbulanceAdmin {
  id: string;
  ownerName: string;
  licenseNumber: string;
  ambulanceNumber: string;
  vehicleType: string;
  contact: string;
  available: boolean;
}

interface AppState {
  language: string;
  hapticMode: boolean;
  highContrast: boolean;
  darkMode: boolean;
  userProfile: UserProfile | null;
  tripDetails: TripDetails | null;
  hasCompletedOnboarding: boolean;
  currentTransportMode: string | null;
  expenses: TripExpense[];
  ambulanceAdmins: AmbulanceAdmin[];
  isEmergencyActive: boolean;
}

type AppAction =
  | { type: "SET_LANGUAGE"; payload: string }
  | { type: "TOGGLE_HAPTIC_MODE" }
  | { type: "TOGGLE_HIGH_CONTRAST" }
  | { type: "TOGGLE_DARK_MODE" }
  | { type: "SET_USER_PROFILE"; payload: UserProfile }
  | { type: "SET_TRIP_DETAILS"; payload: TripDetails | null }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "SET_TRANSPORT_MODE"; payload: string | null }
  | { type: "ADD_EXPENSE"; payload: TripExpense }
  | { type: "ADD_AMBULANCE_ADMIN"; payload: AmbulanceAdmin }
  | { type: "SET_AMBULANCE_ADMINS"; payload: AmbulanceAdmin[] }
  | { type: "UPDATE_AMBULANCE_AVAILABILITY"; payload: { id: string; available: boolean } }
  | { type: "SET_EMERGENCY_ACTIVE"; payload: boolean };

const initialState: AppState = {
  ...DEFAULT_PREFERENCES,
  userProfile: null,
  tripDetails: null,
  hasCompletedOnboarding: false,
  currentTransportMode: null,
  expenses: [],
  ambulanceAdmins: [
    {
      id: "1",
      ownerName: "Rajesh Kumar",
      licenseNumber: "AMB-2024-001",
      ambulanceNumber: "KA-01-AB-1234",
      vehicleType: "Advanced Life Support",
      contact: "+91 98765 43210",
      available: true,
    },
    {
      id: "2",
      ownerName: "Priya Sharma",
      licenseNumber: "AMB-2024-002",
      ambulanceNumber: "KA-01-CD-5678",
      vehicleType: "Basic Life Support",
      contact: "+91 87654 32109",
      available: true,
    },
    {
      id: "3",
      ownerName: "Mohammed Ali",
      licenseNumber: "AMB-2024-003",
      ambulanceNumber: "KA-02-EF-9012",
      vehicleType: "Patient Transport",
      contact: "+91 76543 21098",
      available: false,
    },
  ],
  isEmergencyActive: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "TOGGLE_HAPTIC_MODE":
      return { ...state, hapticMode: !state.hapticMode };
    case "TOGGLE_HIGH_CONTRAST":
      return { ...state, highContrast: !state.highContrast };
    case "TOGGLE_DARK_MODE":
      return { ...state, darkMode: !state.darkMode };
    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload };
    case "SET_TRIP_DETAILS":
      return { ...state, tripDetails: action.payload };
    case "COMPLETE_ONBOARDING":
      return { ...state, hasCompletedOnboarding: true };
    case "SET_TRANSPORT_MODE":
      return { ...state, currentTransportMode: action.payload };
    case "ADD_EXPENSE":
      return { ...state, expenses: [...state.expenses, action.payload] };
    case "ADD_AMBULANCE_ADMIN":
      return { ...state, ambulanceAdmins: [...state.ambulanceAdmins, action.payload] };
    case "SET_AMBULANCE_ADMINS":
      return { ...state, ambulanceAdmins: action.payload };
    case "UPDATE_AMBULANCE_AVAILABILITY":
      return {
        ...state,
        ambulanceAdmins: state.ambulanceAdmins.map((admin) =>
          admin.id === action.payload.id
            ? { ...admin, available: action.payload.available }
            : admin
        ),
      };
    case "SET_EMERGENCY_ACTIVE":
      return { ...state, isEmergencyActive: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  triggerHaptic: (pattern: number[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch ambulances from backend on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAmbulances();
        if (mounted && Array.isArray(data)) {
          dispatch({ type: "SET_AMBULANCE_ADMINS", payload: data });
        }
      } catch (err) {
        console.warn("Could not fetch ambulances:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.darkMode]);

  // Apply high contrast mode
  useEffect(() => {
    if (state.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [state.highContrast]);

  // Apply page-level translation using generated i18n files
  useEffect(() => {
    const lang = state.language || "en";
    let active = true;

    const performTranslation = async () => {
      try {
        // Skip translation for English
        if (lang === "en") {
          document.querySelectorAll('[data-translated-en]').forEach((el) => {
            // Remove translation attributes when switching to English
            Array.from(el.attributes).forEach((attr) => {
              if (attr.name.startsWith('data-translated-')) {
                el.removeAttribute(attr.name);
              }
            });
          });
          return;
        }

        const res = await fetch(`/i18n/${lang}.json`);
        const data = res.ok ? await res.json() : {};
        
        if (!active) return;
        const hasMap = data && Object.keys(data).length > 0;
        if (hasMap) {
          // Apply translation immediately
          translatePageWithMap(data || {}, lang);
          
          // Re-translate after a short delay to catch any dynamically rendered content
          setTimeout(() => {
            if (active && document.readyState === 'complete') {
              translatePageWithMap(data || {}, lang);
            }
          }, 100);
          return;
        }

        const clientKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
        if (clientKey) {
          await translatePage(lang, clientKey);
          return;
        }

        await translatePageViaBackend(lang);
      } catch (error) {
        if (!active) return;
        const clientKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
        if (clientKey) {
          await translatePage(lang, clientKey);
        } else {
          await translatePageViaBackend(lang);
        }
      }
    };

    performTranslation();

    return () => {
      active = false;
    };
  }, [state.language]);

  // Re-translate when DOM changes (page navigation)
  useEffect(() => {
    const lang = state.language || "en";
    if (!lang || lang === "en") return;

    let translationTimeout: NodeJS.Timeout;
    let observerActive = true;
    let lastTranslation = 0;

    const performDOMTranslation = async () => {
      try {
        // Only translate if at least 500ms has passed since last translation
        const now = Date.now();
        if (now - lastTranslation < 500) return;
        lastTranslation = now;

        // Wait for the DOM to be fully interactive
        if (document.readyState === 'loading') return;

        const res = await fetch(`/i18n/${lang}.json`);
        const data = res.ok ? await res.json() : {};
        if (observerActive && data && Object.keys(data).length > 0) {
          translatePageWithMap(data || {}, lang);
        }
      } catch (error) {
        console.warn("DOM translation failed:", error);
      }
    };

    // Use MutationObserver to detect when page content changes
    const observer = new MutationObserver((mutations) => {
      // Only care about significant mutations (added/removed nodes)
      const hasSignificantChanges = mutations.some(
        (m) => m.addedNodes.length > 0 || m.removedNodes.length > 0
      );

      if (!hasSignificantChanges) return;

      // Debounce the translation to avoid excessive re-translations
      clearTimeout(translationTimeout);
      translationTimeout = setTimeout(() => {
        if (observerActive && document.readyState === 'complete') {
          performDOMTranslation();
        }
      }, 500);
    });

    // Start observing DOM changes - only childList, not all mutations
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    return () => {
      observerActive = false;
      clearTimeout(translationTimeout);
      observer.disconnect();
    };
  }, [state.language]);

  // Haptic feedback function
  const triggerHaptic = (pattern: number[]) => {
    if (state.hapticMode && "vibrate" in navigator) {
      navigator.vibrate(pattern);
      console.log("Haptic feedback triggered:", pattern);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, triggerHaptic }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
