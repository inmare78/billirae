import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import VoiceInput from '../components/voice/VoiceInput';
import InvoicePreview from '../components/invoice/InvoicePreview';
import { invoiceService, supabaseService } from '../services/api';
import { checkSupabaseConnection } from '../services/supabaseClient';
import jsPDF from 'jspdf';

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

function CreateInvoicePage() {
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
  const [supabaseSuccess, setSupabaseSuccess] = useState(false);
  const [supabaseConnectionStatus, setSupabaseConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  const handleTranscriptChange = (text: string) => {
    console.log('Transcript received:', text);
  };

  const handleInvoiceDataChange = (data: InvoiceData | null) => {
    setParsedData(data);
    if (data === null || (parsedData !== null && JSON.stringify(data) !== JSON.stringify(parsedData))) {
      setInvoiceId(null);
      setPdfUrl(null);
      setShowEmailForm(false);
      setEmailSent(false);
      setEmailError('');
    }
  };

  const handleCreateInvoice = async () => {
    if (!parsedData) return;

    console.log('Creating invoice with parsed data:', parsedData);
    setIsProcessing(true);
    setError('');
    setSupabaseSuccess(false);

    try {
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      if (!isTestMode) {
        console.log('Checking Supabase connection before creating invoice');
        const { connected, error: connectionError } = await checkSupabaseConnection();
        if (!connected) {
          console.error('Supabase connection test failed:', connectionError);
          setError(`Verbindungsproblem mit Supabase: ${connectionError instanceof Error ? connectionError.message : 'Netzwerkfehler'}`);
          setIsProcessing(false);
          return;
        }
        console.log('Supabase connection verified successfully');
      }
      
      if (isTestMode) {
        console.log('Test mode detected, skipping actual API call');
        const mockInvoiceId = 'mock-invoice-id-123';
        console.log('Setting invoice ID in test mode');
        setInvoiceId(mockInvoiceId);
        console.log('Invoice ID set to:', mockInvoiceId);
        
        try {
          console.log('Saving invoice data to Supabase in test mode');
          await supabaseService.saveInvoice(parsedData, mockInvoiceId);
          console.log('Successfully saved to Supabase in test mode');
          setSupabaseSuccess(true);
        } catch (supabaseError) {
          console.error('Error saving to Supabase:', supabaseError);
          setSupabaseSuccess(false);
          const errorMessage = supabaseError instanceof Error ? supabaseError.message : 'Netzwerkfehler';
          setError(`Fehler beim Speichern in Supabase: ${errorMessage}`);
        }
        
        setTimeout(() => {
          console.log('Auto-generating PDF in test mode');
          handleGeneratePDF(mockInvoiceId);
        }, 500);
      } else {
        const response = await invoiceService.createInvoice(parsedData);
        console.log('Invoice created with ID:', response.id);
        setInvoiceId(response.id);
        
        try {
          const savedInvoice = await supabaseService.saveInvoice(parsedData, response.id);
          console.log('Successfully saved invoice to Supabase:', savedInvoice);
          setSupabaseSuccess(true);
        } catch (supabaseError) {
          console.error('Error saving to Supabase:', supabaseError);
          setSupabaseSuccess(false);
          const errorMessage = supabaseError instanceof Error ? supabaseError.message : 'Netzwerkfehler';
          setError(`Fehler beim Speichern in Supabase: ${errorMessage}`);
        }
        
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
        console.log('Test mode detected, generating mock PDF with jsPDF');
        
        if (!parsedData) {
          throw new Error('Keine Rechnungsdaten vorhanden');
        }
        
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('Billirae', 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Timejet GmbH', 20, 30);
        doc.text('Musterstraße 123', 20, 35);
        doc.text('10115 Berlin', 20, 40);
        doc.text('Deutschland', 20, 45);
        
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text('RECHNUNG', 105, 60, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Rechnungsnummer: INV-${id}`, 20, 75);
        doc.text(`Datum: ${parsedData.invoice_date}`, 20, 82);
        
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text('Kunde:', 140, 75);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(parsedData.client, 140, 82);
        
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 95, 170, 10, 'F');
        doc.setFontSize(10);
        doc.setTextColor(44, 62, 80);
        doc.text('Beschreibung', 25, 101);
        doc.text('Menge', 100, 101);
        doc.text('Einzelpreis', 125, 101);
        doc.text('Gesamt', 170, 101, { align: 'right' });
        
        doc.setTextColor(0, 0, 0);
        doc.text(parsedData.service, 25, 115);
        doc.text(parsedData.quantity.toString(), 100, 115);
        doc.text(`${parsedData.unit_price.toFixed(2)} ${parsedData.currency}`, 125, 115);
        
        const totalBeforeTax = parsedData.quantity * parsedData.unit_price;
        doc.text(`${totalBeforeTax.toFixed(2)} ${parsedData.currency}`, 170, 115, { align: 'right' });
        
        const taxAmount = totalBeforeTax * parsedData.tax_rate;
        const totalWithTax = totalBeforeTax + taxAmount;
        
        doc.line(20, 125, 190, 125);
        doc.text(`Zwischensumme:`, 125, 135);
        doc.text(`${totalBeforeTax.toFixed(2)} ${parsedData.currency}`, 170, 135, { align: 'right' });
        
        doc.text(`MwSt. (${(parsedData.tax_rate * 100).toFixed(0)}%):`, 125, 142);
        doc.text(`${taxAmount.toFixed(2)} ${parsedData.currency}`, 170, 142, { align: 'right' });
        
        doc.line(125, 145, 190, 145);
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text(`Gesamtbetrag:`, 125, 152);
        doc.text(`${totalWithTax.toFixed(2)} ${parsedData.currency}`, 170, 152, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Vielen Dank für Ihr Vertrauen!', 105, 200, { align: 'center' });
        doc.text('Billirae - Timejet GmbH', 105, 270, { align: 'center' });
        doc.text('www.billirae.com', 105, 275, { align: 'center' });
        
        const pdfDataUrl = doc.output('datauristring');
        
        const mockResponse = {
          pdf_url: pdfDataUrl,
          success: true
        };
        
        console.log('Mock PDF generated with jsPDF');
        setPdfUrl(mockResponse.pdf_url);
        console.log('PDF URL set to data URL (truncated):', pdfDataUrl.substring(0, 50) + '...');
      } else {
        const response = await invoiceService.generatePDF(id);
        setPdfUrl(response.pdf_url);
        console.log('PDF URL set to:', response.pdf_url);
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
        console.log('Test mode detected, simulating email sending');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Email would be sent to:', recipientEmail);
        console.log('With subject:', emailSubject);
        console.log('And message:', emailMessage);
        console.log('Including PDF attachment');
      } else {
        let pdfData: string | Blob | undefined;
        
        if (pdfUrl && pdfUrl.startsWith('data:')) {
          pdfData = pdfUrl;
        } else if (pdfUrl) {
          try {
            const response = await fetch(pdfUrl);
            pdfData = await response.blob();
          } catch (error) {
            console.error('Error fetching PDF for email attachment:', error);
          }
        }
        
        const emailData = {
          recipient_email: recipientEmail,
          subject: emailSubject,
          message: emailMessage,
          pdf_data: pdfData
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

  useEffect(() => {
    console.log('Rendering component with pdfUrl:', pdfUrl);
  }, [pdfUrl]);
  
  useEffect(() => {
    const testConnection = async () => {
      console.log('Testing Supabase connection...');
      try {
        const isTestMode = localStorage.getItem('test_mode') === 'true';
        
        if (isTestMode) {
          console.log('Test mode detected, setting mock connection status');
          setSupabaseConnectionStatus('connected');
          return;
        }
        
        const { connected, error } = await checkSupabaseConnection();
        console.log('Supabase connection check result:', { connected, error });
        setSupabaseConnectionStatus(connected ? 'connected' : 'disconnected');
        console.log('Supabase connection status set to:', connected ? 'Connected' : 'Disconnected');
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
        setSupabaseConnectionStatus('disconnected');
      }
    };
    testConnection();
  }, []);

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
            
            {supabaseConnectionStatus !== 'unknown' && (
              <div className={`mt-4 p-2 rounded-md text-sm flex items-center ${
                supabaseConnectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  supabaseConnectionStatus === 'connected' 
                    ? 'bg-green-500' 
                    : 'bg-yellow-500'
                }`}></div>
                Supabase Status: {supabaseConnectionStatus === 'connected' ? 'Verbunden' : 'Nicht verbunden'}
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
                    {supabaseSuccess && (
                      <p className="mt-2 text-sm text-green-600">Rechnungsdaten erfolgreich gespeichert.</p>
                    )}
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
                  <p className="text-sm mt-1">Der Kunde kann die Rechnung jetzt einsehen und herunterladen.</p>
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
