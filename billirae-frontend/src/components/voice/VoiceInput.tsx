import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import useVoiceRecognition from '../../hooks/voice/useVoiceRecognition';

interface VoiceInputProps {
  onTranscriptChange?: (transcript: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscriptChange, className = '' }: VoiceInputProps) {
  const { 
    isListening, 
    transcript, 
    error, 
    isSupported, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useVoiceRecognition();

  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    if (isListening) {
      setIsPulsing(true);
    } else {
      setIsPulsing(false);
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <MicOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Spracherkennung wird von Ihrem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative flex items-center justify-center">
            {/* Pulsing circles for visual feedback */}
            {isPulsing && (
              <>
                <span className="absolute h-16 w-16 animate-ping rounded-full bg-primary opacity-20"></span>
                <span className="absolute h-20 w-20 animate-ping rounded-full bg-primary opacity-10 delay-75"></span>
                <span className="absolute h-24 w-24 animate-ping rounded-full bg-primary opacity-5 delay-150"></span>
              </>
            )}
            
            <Button
              onClick={toggleListening}
              size="lg"
              className={`h-14 w-14 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
              aria-label={isListening ? 'Aufnahme stoppen' : 'Aufnahme starten'}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </div>

          <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">
                {isListening ? (
                  <span className="flex items-center text-primary">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ich höre zu...
                  </span>
                ) : (
                  <span>Tippen Sie auf das Mikrofon, um zu sprechen</span>
                )}
              </p>
              {transcript && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetTranscript}
                  className="h-8 px-2 text-xs"
                >
                  Löschen
                </Button>
              )}
            </div>

            <div className="min-h-24 rounded-md border bg-background p-3 text-sm">
              {transcript || (
                <span className="text-muted-foreground">
                  Sprechen Sie Ihre Rechnung ein, z.B. "Drei Massagen à 80 Euro für Max Mustermann, heute, inklusive Mehrwertsteuer."
                </span>
              )}
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-500">
                Fehler: {error}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
