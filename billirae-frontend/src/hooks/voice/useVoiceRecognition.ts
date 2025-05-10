import { useState, useEffect, useCallback } from 'react';

interface UseVoiceRecognitionReturn {
  transcript: string;
  listening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

// Define the SpeechRecognition type for TypeScript
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: Event) => void;
  onstart: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// Define a type for the SpeechRecognition constructor
type SpeechRecognitionConstructor = new () => SpeechRecognition;

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);

  useEffect(() => {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (typeof SpeechRecognitionImpl !== 'undefined') {
      setBrowserSupportsSpeechRecognition(true);
      
      const recognitionInstance = new SpeechRecognitionImpl();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'de-DE'; // Set language to German
      recognitionInstance.maxAlternatives = 1;
      
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        
        if (currentTranscript) {
          setTranscript(prev => {
            const newTranscript = prev ? `${prev} ${currentTranscript}` : currentTranscript;
            return newTranscript.trim();
          });
        }
      };
      
      recognitionInstance.onstart = () => {
        setListening(true);
      };
      
      recognitionInstance.onend = () => {
        setListening(false);
      };
      
      recognitionInstance.onerror = (event: Event) => {
        console.error('Speech recognition error', event);
        setListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !listening) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [recognition, listening]);

  const stopListening = useCallback(() => {
    if (recognition && listening) {
      recognition.stop();
    }
  }, [recognition, listening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  };
};

export default useVoiceRecognition;
