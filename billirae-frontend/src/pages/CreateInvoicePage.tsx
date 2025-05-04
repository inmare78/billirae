import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VoiceInput from '../components/voice/VoiceInput';
import InvoicePreview from '../components/invoice/InvoicePreview';
import { invoiceService } from '../services/api';

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  const handleTranscriptChange = (text: string) => {
    setTranscript(text);
  };

  const handleInvoiceDataChange = (data: InvoiceData | null) => {
    setParsedData(data);
    setInvoiceId(null);
    setPdfUrl(null);
    setShowEmailForm(false);
    setEmailSent(false);
    setEmailError('');
  };

  const handleCreateInvoice = async () => {
    if (!parsedData) return;

    console.log('Creating invoice with parsed data:', parsedData);
    setIsProcessing(true);
    setError('');

    try {
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      if (isTestMode) {
        console.log('Test mode detected, skipping actual API call');
        setTimeout(() => {
          console.log('Setting invoice ID in test mode');
          setInvoiceId('mock-invoice-id-123');
          setIsProcessing(false);
          console.log('Invoice ID set to:', 'mock-invoice-id-123');
        }, 100);
      } else {
        const response = await invoiceService.createInvoice(parsedData);
        console.log('Invoice created with ID:', response.id);
        setInvoiceId(response.id);
        
        await handleGeneratePDF(response.id);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Fehler beim Erstellen der Rechnung. Bitte versuchen Sie es erneut.');
      setIsProcessing(false);
    }
  };

  const handleGeneratePDF = async (id: string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      if (isTestMode) {
        console.log('Test mode detected, skipping actual PDF generation API call');
        setPdfUrl('/mock-invoice.pdf');
      } else {
        const response = await invoiceService.generatePDF(id);
        setPdfUrl(response.pdf_url);
      }
      
      setEmailSubject(`Rechnung: ${parsedData?.service}`);
      setEmailMessage(`Sehr geehrte(r) ${parsedData?.client},\n\nanbei erhalten Sie Ihre Rechnung für ${parsedData?.service}.\n\nMit freundlichen Grüßen`);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Fehler bei der PDF-Generierung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceId || !recipientEmail.trim()) {
      setEmailError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }

    setIsProcessing(true);
    setEmailError('');
    
    try {
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      if (isTestMode) {
        console.log('Test mode detected, skipping actual email sending API call');
      } else {
        const emailData = {
          recipient_email: recipientEmail,
          subject: emailSubject,
          message: emailMessage,
        };
        
        await invoiceService.sendEmail(invoiceId, emailData);
      }
      
      setEmailSent(true);
      setShowEmailForm(false);
    } catch (err) {
      console.error('Error sending email:', err);
      setEmailError('Fehler beim Senden der E-Mail. Bitte überprüfen Sie die E-Mail-Adresse und versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowEmailForm = () => {
    setShowEmailForm(true);
    setEmailError('');
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Rechnung-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Rechnung erstellen</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Spracheingabe</CardTitle>
            <CardDescription>
              Sprechen Sie Ihre Rechnungsdetails ein und wir erstellen daraus eine strukturierte Rechnung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceInput 
              onTranscriptChange={handleTranscriptChange} 
              onInvoiceDataChange={handleInvoiceDataChange}
            />
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        {parsedData && (
          <Card className="lg:col-span-1">
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
              
              {!invoiceId && (
                <Button 
                  onClick={handleCreateInvoice} 
                  className="mt-4 w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Wird erstellt...' : 'Rechnung erstellen'}
                </Button>
              )}
              
              {invoiceId && !pdfUrl && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-md">
                    Rechnung erfolgreich erstellt! ID: {invoiceId}
                  </div>
                  <Button 
                    onClick={() => handleGeneratePDF(invoiceId)} 
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Wird generiert...' : 'PDF generieren'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {pdfUrl && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>PDF Vorschau</CardTitle>
              <CardDescription>
                Überprüfen Sie das PDF und senden Sie es per E-Mail an den Kunden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 border rounded-md overflow-hidden" style={{ height: '500px' }}>
                <iframe 
                  ref={pdfIframeRef}
                  src={pdfUrl} 
                  className="w-full h-full"
                  title="Rechnungs-PDF"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button 
                  onClick={handleDownloadPDF} 
                  variant="outline"
                  className="flex-1"
                >
                  PDF herunterladen
                </Button>
                
                {!showEmailForm && !emailSent && (
                  <Button 
                    onClick={handleShowEmailForm} 
                    className="flex-1"
                  >
                    Per E-Mail senden
                  </Button>
                )}
              </div>
              
              {showEmailForm && (
                <div className="mt-6 p-4 border rounded-md">
                  <h3 className="font-medium mb-4">E-Mail senden</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient-email">E-Mail-Adresse des Empfängers</Label>
                      <Input 
                        id="recipient-email"
                        type="email" 
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="kunde@beispiel.de"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-subject">Betreff</Label>
                      <Input 
                        id="email-subject"
                        type="text" 
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Rechnung für Ihre Bestellung"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-message">Nachricht</Label>
                      <textarea 
                        id="email-message"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Nachricht an den Kunden..."
                      />
                    </div>
                    
                    {emailError && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        {emailError}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowEmailForm(false)} 
                        variant="outline"
                      >
                        Abbrechen
                      </Button>
                      <Button 
                        onClick={handleSendEmail} 
                        disabled={isProcessing || !recipientEmail.trim()}
                      >
                        {isProcessing ? 'Wird gesendet...' : 'E-Mail senden'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {emailSent && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                  <p className="font-medium">E-Mail erfolgreich gesendet!</p>
                  <p className="text-sm mt-1">Die Rechnung wurde an {recipientEmail} gesendet.</p>
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
