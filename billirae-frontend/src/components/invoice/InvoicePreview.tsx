import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import invoiceService from '../../services/invoiceService';

interface InvoicePreviewProps {
  invoiceId: string;
  onEmailSent?: () => void;
}

export default function InvoicePreview({ invoiceId, onEmailSent }: InvoicePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [emailData, setEmailData] = useState({
    recipient_email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (invoiceId) {
      setPdfUrl(invoiceService.getPDFUrl(invoiceId));
    }
  }, [invoiceId]);

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleSendEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await invoiceService.sendEmail(invoiceId, {
        recipient_email: emailData.recipient_email,
        subject: emailData.subject || undefined,
        message: emailData.message || undefined,
      });
      
      setSuccess('Rechnung wurde erfolgreich per E-Mail versendet');
      setEmailDialogOpen(false);
      
      if (onEmailSent) {
        onEmailSent();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Versenden der E-Mail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {invoiceId && (
            <iframe 
              src={pdfUrl} 
              className="w-full h-[600px] border-0"
              title="Rechnungsvorschau"
            />
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Herunterladen
        </Button>
        
        <Button
          onClick={() => setEmailDialogOpen(true)}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Per E-Mail senden
        </Button>
      </div>
      
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rechnung per E-Mail senden</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_email">Empfänger E-Mail</Label>
              <Input
                id="recipient_email"
                name="recipient_email"
                type="email"
                placeholder="kunde@beispiel.de"
                value={emailData.recipient_email}
                onChange={handleEmailInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Betreff (optional)</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Rechnung für Ihre Bestellung"
                value={emailData.subject}
                onChange={handleEmailInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Nachricht (optional)</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Vielen Dank für Ihren Auftrag. Bei Fragen stehe ich Ihnen gerne zur Verfügung."
                value={emailData.message}
                onChange={handleEmailInputChange}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={!emailData.recipient_email || isLoading}
            >
              {isLoading ? 'Wird gesendet...' : 'Senden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
