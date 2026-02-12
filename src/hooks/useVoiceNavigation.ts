// src/hooks/useVoiceNavigation.ts
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useApp } from '@/context/AppContext';

export const useVoiceNavigation = () => {
  const { state } = useApp();
  const { language } = state;
  
  // Language code mapping for speech recognition
  const languageMap: Record<string, string> = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'ml': 'ml-IN',
    'kn': 'kn-IN',
    'bn': 'bn-IN',
    'mr': 'mr-IN',
    'gu': 'gu-IN',
    'pa': 'pa-IN',
    'es': 'es-ES',
    'fr': 'fr-FR'
  };
  
  const currentLang = languageMap[language] || 'en-IN';
  
  // Disable command automation; keep raw listening/transcript only.
  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition({ commands: [] });

  // Optional: Auto-start on mount (WARNING: Requires user interaction first)
  // useEffect(() => {
  //   SpeechRecognition.startListening({ continuous: true, language: currentLang });
  // }, []);

  return { 
    listening, 
    transcript, 
    startListening: () => SpeechRecognition.startListening({ continuous: true, language: currentLang }), 
    stopListening: SpeechRecognition.stopListening,
    browserSupportsSpeechRecognition
  };
};
