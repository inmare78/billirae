import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import useVoiceRecognition from '../../hooks/voice/useVoiceRecognition';
import { voiceService } from '../../services/api';

interface InvoiceData {
  client: string;
  service: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  invoice_date: string;
  currency: string;
  language: string;
}

interface VoiceInputProps {
  onTranscriptChange: (transcript: string) => void;
  onInvoiceDataChange?: (data: InvoiceData | null) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscriptChange, 
  onInvoiceDataChange 
}) => {
  // For browser-native speech recognition
  const { 
    transcript, 
    listening: nativeListening, 
    startListening: startNativeListening, 
    stopListening: stopNativeListening, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useVoiceRecognition();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [listening, setListening] = useState(false);
  const [recordingMethod, setRecordingMethod] = useState<'native' | 'whisper'>('native');
  const [localTranscript, setLocalTranscript] = useState('');
  
  const isTestMode = typeof localStorage !== 'undefined' && localStorage.getItem('test_mode') === 'true';
  console.log('VoiceInput: Test mode is', isTestMode ? 'enabled' : 'disabled');
  
  const testTranscript = "Drei Massagen à 80 Euro für Max Mustermann, heute, inklusive Mehrwertsteuer.";

  useEffect(() => {
    // When using native speech recognition, update the local transcript
    if (recordingMethod === 'native') {
      setLocalTranscript(transcript);
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange, recordingMethod]);

  useEffect(() => {
    if (recordingMethod === 'native') {
      setListening(nativeListening);
    }
  }, [nativeListening, recordingMethod]);

  useEffect(() => {
    if (onInvoiceDataChange && invoiceData) {
      onInvoiceDataChange(invoiceData);
    }
  }, [invoiceData, onInvoiceDataChange]);

  const startWhisperRecording = async () => {
    try {
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported');
      }
      
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout requesting microphone access')), 10000);
      });
      
      const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream;
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Fehler bei der Aufnahme. Bitte versuchen Sie es erneut.');
        setListening(false);
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      };
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error('No audio data recorded');
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          if (audioBlob.size < 1000) {
            throw new Error('Audio recording too short or no speech detected');
          }
          
          await processAudioRecording(audioBlob);
        } catch (error) {
          console.error('Error processing recording:', error);
          const err = error as Error;
          if (err.message && err.message.includes('too short')) {
            setError('Keine Sprache erkannt. Bitte sprechen Sie deutlich und versuchen Sie es erneut.');
          } else {
            setError('Fehler bei der Verarbeitung der Aufnahme. Bitte versuchen Sie es erneut.');
          }
          setIsProcessing(false);
        } finally {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      };
      
      mediaRecorder.start(3000); // Collect data in 3-second chunks
      mediaRecorderRef.current = mediaRecorder;
      setListening(true);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      const err = error as Error & { name?: string };
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Mikrofon-Zugriff verweigert. Bitte erteilen Sie die Berechtigung in Ihren Browser-Einstellungen.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Kein Mikrofon gefunden. Bitte stellen Sie sicher, dass ein Mikrofon angeschlossen ist.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Mikrofon wird bereits von einer anderen Anwendung verwendet. Bitte schließen Sie andere Anwendungen, die das Mikrofon nutzen könnten.');
      } else if (err.message && err.message.includes('MediaRecorder not supported')) {
        setError('Ihr Browser unterstützt die Audioaufnahme nicht. Bitte verwenden Sie Chrome oder Safari.');
        if (browserSupportsSpeechRecognition) {
          setRecordingMethod('native');
          startNativeListening();
          return;
        }
      } else if (err.message && err.message.includes('Timeout')) {
        setError('Zeitüberschreitung beim Zugriff auf das Mikrofon. Bitte versuchen Sie es erneut.');
      } else {
        setError('Zugriff auf das Mikrofon fehlgeschlagen. Bitte erteilen Sie die Berechtigung und versuchen Sie es erneut.');
      }
      
      setListening(false);
    }
  };
  
  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setListening(false);
    }
  };
  
  const processAudioRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await voiceService.transcribeAudio(audioBlob);
      const text = response.transcript || '';
      
      setLocalTranscript(text);
      onTranscriptChange(text);
      
      if (text.trim()) {
        await processTranscript(text);
      }
    } catch (error) {
      console.error('Error processing audio recording:', error);
      setError('Fehler bei der Verarbeitung der Audioaufnahme. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      if (recordingMethod === 'native') {
        stopNativeListening();
        if (transcript.trim()) {
          processTranscript(transcript);
        }
      } else {
        stopWhisperRecording();
      }
    } else {
      setError(null);
      setInvoiceData(null);
      
      if (isTestMode) {
        console.log("TEST MODE ACTIVATED in toggleListening");
        // In test mode, skip the speech recognition and directly process the test transcript
        setIsProcessing(true);
        setLocalTranscript(testTranscript);
        onTranscriptChange(testTranscript);
        
        console.log("TEST MODE: Processing transcript immediately");
        processTranscript(testTranscript);
      } else {
        // Try to use Whisper API first, fallback to native speech recognition
        if (recordingMethod === 'whisper') {
          startWhisperRecording();
        } else {
          startNativeListening();
        }
      }
    }
  };

  const handleReset = () => {
    resetTranscript();
    setLocalTranscript('');
    onTranscriptChange('');
    setInvoiceData(null);
    if (onInvoiceDataChange) {
      onInvoiceDataChange(null);
    }
    setError(null);
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    console.log("Processing transcript:", text);
    setIsProcessing(true);
    setError(null);
    
    try {
      let data;
      if (isTestMode) {
        console.log("TEST MODE ACTIVATED in processTranscript");
        data = {
          client: "Max Mustermann",
          service: "Massage",
          quantity: 3,
          unit_price: 80,
          tax_rate: 0.2,
          invoice_date: new Date().toISOString().split('T')[0],
          currency: "EUR",
          language: "de"
        };
      } else {
        data = await voiceService.parseVoiceTranscript(text);
      }
      
      console.log("Setting invoice data:", data);
      setInvoiceData(data);
      if (onInvoiceDataChange) {
        onInvoiceDataChange(data);
      }
    } catch (error) {
      console.error('Error processing voice transcript:', error);
      setError('Fehler bei der Verarbeitung der Sprachaufnahme. Bitte versuchen Sie es erneut.');
      setInvoiceData(null);
      if (onInvoiceDataChange) {
        onInvoiceDataChange(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const canUseSpeechRecognition = browserSupportsSpeechRecognition || isTestMode;
  const canUseMediaRecorder = typeof MediaRecorder !== 'undefined';
  
  if (!canUseSpeechRecognition && !canUseMediaRecorder && !isTestMode) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Ihr Browser unterstützt die Spracherkennung nicht. Bitte verwenden Sie Chrome oder Safari.
      </div>
    );
  }

  const currentTranscript = recordingMethod === 'native' ? transcript : localTranscript;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div 
          className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
            listening 
              ? 'bg-primary/10 animate-pulse' 
              : isProcessing
                ? 'bg-amber-100'
                : 'bg-muted'
          }`}
        >
          <Button
            onClick={toggleListening}
            variant={listening ? "destructive" : "default"}
            size="icon"
            className="w-16 h-16 rounded-full"
            aria-label={listening ? "Aufnahme stoppen" : "Aufnahme starten"}
            disabled={isProcessing}
          >
            {listening ? (
              <span className="h-4 w-4 rounded-sm bg-background"></span>
            ) : isProcessing ? (
              <svg
                className="animate-spin h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </Button>
          {listening && (
            <div className="absolute -inset-4 rounded-full border-4 border-primary animate-ping opacity-20"></div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {listening 
            ? "Sprechen Sie jetzt..." 
            : isProcessing 
              ? "Verarbeite Sprachaufnahme..." 
              : "Klicken Sie auf das Mikrofon, um zu beginnen"}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={toggleListening}
            variant={listening ? "destructive" : "default"}
            size="sm"
            disabled={isProcessing}
          >
            {listening ? "Stoppen" : "Aufnehmen"}
          </Button>
          {(currentTranscript || invoiceData) && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={isProcessing}
            >
              Zurücksetzen
            </Button>
          )}
          {currentTranscript && !listening && !isProcessing && !invoiceData && (
            <Button
              onClick={() => processTranscript(currentTranscript)}
              variant="secondary"
              size="sm"
            >
              Verarbeiten
            </Button>
          )}
        </div>
        
        {/* Recording method toggle */}
        {!isTestMode && canUseSpeechRecognition && canUseMediaRecorder && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Erkennungsmethode:</span>
            <div className="flex rounded-md overflow-hidden border">
              <button
                onClick={() => setRecordingMethod('native')}
                className={`px-2 py-1 text-xs ${
                  recordingMethod === 'native' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                disabled={listening || isProcessing}
              >
                Browser API
              </button>
              <button
                onClick={() => setRecordingMethod('whisper')}
                className={`px-2 py-1 text-xs ${
                  recordingMethod === 'whisper' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                disabled={listening || isProcessing}
              >
                OpenAI Whisper
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {currentTranscript && !invoiceData && !isProcessing && (
        <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
          <p className="font-semibold">Erkannter Text:</p>
          <p className="mt-1">{currentTranscript}</p>
        </div>
      )}

      {invoiceData && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
          <p className="font-semibold">Erkannte Rechnungsdaten:</p>
          <ul className="mt-1 space-y-1">
            <li>Kunde: {invoiceData.client}</li>
            <li>Leistung: {invoiceData.service}</li>
            <li>Menge: {invoiceData.quantity}</li>
            <li>Einzelpreis: {invoiceData.unit_price} {invoiceData.currency}</li>
            <li>MwSt.: {invoiceData.tax_rate * 100}%</li>
            <li>Rechnungsdatum: {new Date(invoiceData.invoice_date).toLocaleDateString('de-DE')}</li>
          </ul>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p>Beispiel: "Drei Massagen à 80 Euro für Max Mustermann, heute, inklusive Mehrwertsteuer."</p>
      </div>
    </div>
  );
};

export default VoiceInput;
