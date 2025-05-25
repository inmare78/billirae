import { useState, useEffect, useCallback } from 'react';

interface UseVoiceRecognitionReturn {
  transcript: string;
  listening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
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
      
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event);
        setListening(false);
      };
      
      setRecognition(recognitionInstance as SpeechRecognition);
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
