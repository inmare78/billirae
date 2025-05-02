import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import VoiceInput from '../components/voice/VoiceInput';

export default function CreateInvoicePage() {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<null | {
    client: string;
    service: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    invoice_date: string;
    currency: string;
    language: string;
  }>(null);

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setParsedData({
        client: "Max Mustermann",
        service: "Massage",
        quantity: 3,
        unit_price: 80,
        tax_rate: 0.2,
        invoice_date: "2025-05-02",
        currency: "EUR",
        language: "de"
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Rechnung erstellen</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold">1. Sprechen Sie Ihre Rechnung ein</h2>
          <VoiceInput 
            onTranscriptChange={handleTranscriptChange} 
            className="w-full"
          />
          
          {transcript && (
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleProcessVoice}
                disabled={isProcessing || !transcript.trim()}
                className="gap-2"
              >
                {isProcessing ? 'Wird verarbeitet...' : 'Verarbeiten'}
                {!isProcessing && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </section>

        {parsedData && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">2. Überprüfen Sie die Rechnungsdaten</h2>
            <Card>
              <CardHeader>
                <CardTitle>Rechnungsdetails</CardTitle>
                <CardDescription>
                  Überprüfen und bearbeiten Sie die extrahierten Informationen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Kunde</dt>
                    <dd className="text-lg">{parsedData.client}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Leistung</dt>
                    <dd className="text-lg">{parsedData.service}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Menge</dt>
                    <dd className="text-lg">{parsedData.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Einzelpreis</dt>
                    <dd className="text-lg">{parsedData.unit_price} {parsedData.currency}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Mehrwertsteuersatz</dt>
                    <dd className="text-lg">{parsedData.tax_rate * 100}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Rechnungsdatum</dt>
                    <dd className="text-lg">{parsedData.invoice_date}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Gesamtbetrag</dt>
                    <dd className="text-2xl font-bold">
                      {parsedData.quantity * parsedData.unit_price} {parsedData.currency}
                    </dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="mr-2">Bearbeiten</Button>
                <Button>Rechnung erstellen</Button>
              </CardFooter>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
