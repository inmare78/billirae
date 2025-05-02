import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import VoiceInput from '../components/voice/VoiceInput';
import InvoicePreview from '../components/invoice/InvoicePreview';
import { voiceService } from '../services/api';
import invoiceService from '../services/invoiceService';

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

const CreateInvoicePage: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const handleTranscriptChange = (text: string) => {
    setTranscript(text);
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) {
      setError('Bitte sprechen Sie zuerst eine Rechnungsbeschreibung ein.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const data = await voiceService.parseVoiceTranscript(transcript);
      setParsedData(data);
    } catch (err) {
      console.error('Error processing voice input:', err);
      setError('Fehler bei der Verarbeitung der Spracheingabe. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await invoiceService.createInvoice(parsedData);
      setInvoiceId(response.id);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Fehler beim Erstellen der Rechnung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Rechnung erstellen</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spracheingabe</CardTitle>
            <CardDescription>
              Sprechen Sie Ihre Rechnungsdetails ein und wir erstellen daraus eine strukturierte Rechnung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceInput onTranscriptChange={handleTranscriptChange} />
            
            {transcript && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Erkannter Text:</h3>
                <div className="p-3 bg-muted rounded-md">{transcript}</div>
                
                <Button 
                  onClick={handleProcessVoice} 
                  className="mt-4 w-full"
                  disabled={isProcessing || !transcript.trim()}
                >
                  {isProcessing ? 'Wird verarbeitet...' : 'Text verarbeiten'}
                </Button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle>Rechnungsvorschau</CardTitle>
              <CardDescription>
                Überprüfen Sie die Rechnungsdaten und bearbeiten Sie sie bei Bedarf.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicePreview 
                invoiceData={parsedData} 
                onDataChange={setParsedData}
              />
              
              <Button 
                onClick={handleCreateInvoice} 
                className="mt-4 w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Wird erstellt...' : 'Rechnung erstellen'}
              </Button>
              
              {invoiceId && (
                <div className="mt-4 p-3 bg-primary/10 text-primary rounded-md">
                  Rechnung erfolgreich erstellt! ID: {invoiceId}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateInvoicePage;
