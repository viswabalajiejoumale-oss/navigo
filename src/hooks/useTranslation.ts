import { useApp } from "@/context/AppContext";
import { useState, useEffect } from "react";

const translations: Record<string, Record<string, string>> = {
  en: {
    // Dashboard
    "Welcome back": "Welcome back",
    "Choose Transport": "Choose Transport",
    "Select your preferred mode of travel": "Select your preferred mode of travel",
    "Haptic Mode Active": "Haptic Mode Active",
    "High contrast and vibration navigation enabled": "High contrast and vibration navigation enabled",
    "Expenses": "Expenses",
    "Ambulance": "Ambulance",
    "Settings": "Settings",
    "Always here to help": "Always here to help",
    
    // ExploreMode & Map
    "Live Map View": "Live Map View",
    "Map View": "Map View",
    "Start location": "Start location",
    "End location": "End location",
    "Both": "Both",
    "Choose destination": "Choose destination",
    "Tutorial": "Tutorial",
    "Track Vehicle": "Track Vehicle",
    "Chat with AI": "Chat with AI",
    "Accessibility": "Accessibility",
    "Helpline": "Helpline",
    "Popular Destinations": "Popular Destinations",
    "Route Comparison": "Route Comparison",
    "Route Details": "Route Details",
    "Live Schedule": "Live Schedule",
    "Next departure": "Next departure",
    "Following": "Following",
    "Later": "Later",
    "Platform": "Platform",
    "On Time": "On Time",
    "delay": "delay",
    
    // Vehicle Tracker
    "Vehicle Tracking": "Vehicle Tracking",
    "Start Tracking": "Start Tracking",
    "Stop Tracking": "Stop Tracking",
    "Current Location": "Current Location",
    "Speed": "Speed",
    "Heading": "Heading",
    "Distance Traveled": "Distance Traveled",
    "Est. Arrival": "Est. Arrival",
    "Route Progress": "Route Progress",
    "From": "From",
    "To": "To",
    
    // Chat
    "Ask me anything": "Ask me anything",
    "Send": "Send",
    "AI Assistant": "AI Assistant",
    
    // Route Planner
    "Origin (type or choose)": "Origin (type or choose)",
    "Destination (type or choose)": "Destination (type or choose)",
    "Go": "Go",
    "Base": "Base",
    "Per km": "Per km",
    "Per min": "Per min",
    "Distance": "Distance",
    "km": "km",
    "Duration": "Duration",
    "min": "min",
    "Est. Cost": "Est. Cost",
    "Air Quality (near route)": "Air Quality (near route)",
    "Unavailable": "Unavailable",
    "Calculating...": "Calculating...",
    
    // Generic
    "Loading": "Loading",
    "Error": "Error",
    "Done": "Done",
    "Cancel": "Cancel",
    "Back": "Back",
    "Save": "Save",
    "Delete": "Delete",
    "Edit": "Edit",
    "Search": "Search",
  },
  es: {
    // Spanish translations (basic)
    "Welcome back": "¡Bienvenido de nuevo",
    "Choose Transport": "Elige transporte",
    "Select your preferred mode of travel": "Seleccione su modo de viaje preferido",
    "Haptic Mode Active": "Modo háptico activado",
    "High contrast and vibration navigation enabled": "Alto contraste y navegación por vibración activados",
    "Expenses": "Gastos",
    "Ambulance": "Ambulancia",
    "Settings": "Ajustes",
    "Always here to help": "Siempre aquí para ayudar",
    "Live Map View": "Vista de mapa en vivo",
    "Map View": "Vista de mapa",
    "Start location": "Ubicación de inicio",
    "End location": "Ubicación de destino",
    "Both": "Ambos",
    "Choose destination": "Elige destino",
    "Tutorial": "Tutorial",
    "Track Vehicle": "Rastrear vehículo",
    "Chat with AI": "Chatear con IA",
    "Accessibility": "Accesibilidad",
    "Helpline": "Línea de ayuda",
    "Popular Destinations": "Destinos populares",
    "Route Comparison": "Comparación de rutas",
    "Route Details": "Detalles de la ruta",
    "Live Schedule": "Horario en vivo",
    "Next departure": "Próxima salida",
    "Following": "Siguiendo",
    "Later": "Luego",
    "Platform": "Andén",
    "On Time": "A tiempo",
    "delay": "retraso",
    "Vehicle Tracking": "Seguimiento de vehículo",
    "Start Tracking": "Iniciar seguimiento",
    "Stop Tracking": "Detener seguimiento",
    "Current Location": "Ubicación actual",
    "Speed": "Velocidad",
    "Heading": "Dirección",
    "Distance Traveled": "Distancia recorrida",
    "Est. Arrival": "Llegada estimada",
    "Route Progress": "Progreso de la ruta",
    "From": "Desde",
    "To": "Hasta",
    "Ask me anything": "Pregúntame lo que quieras",
    "Send": "Enviar",
    "AI Assistant": "Asistente IA",
    "Origin (type or choose)": "Origen (escriba o elija)",
    "Destination (type or choose)": "Destino (escriba o elija)",
    "Go": "Ir",
    "Base": "Base",
    "Per km": "Por km",
    "Per min": "Por min",
    "Distance": "Distancia",
    "km": "km",
    "Duration": "Duración",
    "min": "min",
    "Est. Cost": "Coste estimado",
    "Air Quality (near route)": "Calidad del aire (cerca de la ruta)",
    "Unavailable": "No disponible",
    "Calculating...": "Calculando...",
    "Loading": "Cargando",
    "Error": "Error",
    "Done": "Hecho",
    "Cancel": "Cancelar",
    "Back": "Atrás",
    "Save": "Guardar",
    "Delete": "Eliminar",
    "Edit": "Editar",
    "Search": "Buscar",
  },
  fr: {
    // French translations (basic)
    "Welcome back": "Bon retour",
    "Choose Transport": "Choisir le transport",
    "Select your preferred mode of travel": "Sélectionnez votre mode de voyage préféré",
    "Haptic Mode Active": "Mode haptique activé",
    "High contrast and vibration navigation enabled": "Contraste élevé et navigation par vibration activés",
    "Expenses": "Dépenses",
    "Ambulance": "Ambulance",
    "Settings": "Paramètres",
    "Always here to help": "Toujours là pour aider",
    "Live Map View": "Vue carte en direct",
    "Map View": "Vue carte",
    "Start location": "Lieu de départ",
    "End location": "Lieu d'arrivée",
    "Both": "Les deux",
    "Choose destination": "Choisir la destination",
    "Tutorial": "Tutoriel",
    "Track Vehicle": "Suivre le véhicule",
    "Chat with AI": "Chat avec l'IA",
    "Accessibility": "Accessibilité",
    "Helpline": "Ligne d'assistance",
    "Popular Destinations": "Destinations populaires",
    "Route Comparison": "Comparaison d'itinéraires",
    "Route Details": "Détails de l'itinéraire",
    "Live Schedule": "Horaire en direct",
    "Next departure": "Prochain départ",
    "Following": "Suivant",
    "Later": "Plus tard",
    "Platform": "Quai",
    "On Time": "À l'heure",
    "delay": "retard",
    "Vehicle Tracking": "Suivi du véhicule",
    "Start Tracking": "Commencer le suivi",
    "Stop Tracking": "Arrêter le suivi",
    "Current Location": "Position actuelle",
    "Speed": "Vitesse",
    "Heading": "Cap",
    "Distance Traveled": "Distance parcourue",
    "Est. Arrival": "Arrivée estimée",
    "Route Progress": "Progression de l'itinéraire",
    "From": "De",
    "To": "À",
    "Ask me anything": "Demandez-moi n'importe quoi",
    "Send": "Envoyer",
    "AI Assistant": "Assistant IA",
    "Origin (type or choose)": "Origine (tapez ou choisissez)",
    "Destination (type or choose)": "Destination (tapez ou choisissez)",
    "Go": "Aller",
    "Base": "Base",
    "Per km": "Par km",
    "Per min": "Par min",
    "Distance": "Distance",
    "km": "km",
    "Duration": "Durée",
    "min": "min",
    "Est. Cost": "Coût estimé",
    "Air Quality (near route)": "Qualité de l'air (près de l'itinéraire)",
    "Unavailable": "Indisponible",
    "Calculating...": "Calcul en cours...",
    "Loading": "Chargement",
    "Error": "Erreur",
    "Done": "Terminé",
    "Cancel": "Annuler",
    "Back": "Retour",
    "Save": "Enregistrer",
    "Delete": "Supprimer",
    "Edit": "Modifier",
    "Search": "Rechercher",
    "Choose Your Language": "Choisissez votre langue",
    "Select your preferred language for the app": "Sélectionnez votre langue préférée pour l'application",
  },
};

// Add language selection page translations
translations.en["Choose Your Language"] = "Choose Your Language";
translations.en["Select your preferred language for the app"] = "Select your preferred language for the app";
translations.es["Choose Your Language"] = "Elige tu idioma";
translations.es["Select your preferred language for the app"] = "Selecciona tu idioma preferido para la aplicación";

export function useTranslation() {
  const { state } = useApp();
  const [remoteTranslations, setRemoteTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const lang = state.language || "en";
    let active = true;

    fetch(`/i18n/${lang}.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!active) return;
        setRemoteTranslations(data || {});
      })
      .catch(() => {
        if (active) setRemoteTranslations({});
      });

    return () => {
      active = false;
    };
  }, [state.language]);

  const t = (key: string): string => {
    const lang = state.language || "en";
    if (remoteTranslations && remoteTranslations[key]) return remoteTranslations[key];
    if (translations[lang] && translations[lang][key]) return translations[lang][key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return key;
  };

  return { t, language: state.language };
}
