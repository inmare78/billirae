import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, Send, Edit, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import invoiceService from '../../services/invoiceService';
import { InvoiceData } from '../../types/invoice';

interface InvoicePreviewProps {
  invoiceId?: string;
  invoiceData?: InvoiceData;
  onDataChange?: (data: InvoiceData) => void;
  onEmailSent?: () => void;
}

export default function InvoicePreview({ invoiceId, invoiceData, onDataChange, onEmailSent }: InvoicePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [emailData, setEmailData] = useState({
    recipient_email: '',
    subject: '',
    message: '',
  });
  const [editedData, setEditedData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    if (invoiceId) {
      setPdfUrl(invoiceService.getPDFUrl(invoiceId));
    }
    
    if (invoiceData) {
      setEditedData(invoiceData);
    }
  }, [invoiceId, invoiceData]);

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceId) {
      setError('Keine Rechnungs-ID vorhanden');
      return;
    }
    
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
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 'data' in err.response &&
          err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data &&
          typeof err.response.data.detail === 'string') {
        setError(err.response.data.detail);
      } else {
        setError('Fehler beim Versenden der E-Mail');
      }
    
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

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSaveEdit = () => {
    if (editedData && onDataChange) {
      onDataChange(editedData);
      setEditMode(false);
      setSuccess('Rechnungsdaten wurden aktualisiert');
    }
  };

  const handleCancelEdit = () => {
    if (invoiceData) {
      setEditedData(invoiceData);
    }
    setEditMode(false);
  };

  const updateFirstItem = (prev: InvoiceData | null, field: string, value: string | number): InvoiceData | null => {
    if (!prev) return null;
    
    const firstItem = prev.items[0] || {
      service: '',
      quantity: 0,
      unit_price: 0,
      vat: 0
    };
    
    const updatedItem = { ...firstItem, [field]: typeof value === 'string' ? value : parseFloat(value.toString()) };
    
    return {
      ...prev,
      items: [updatedItem, ...prev.items.slice(1)]
    };
  };

  const handleEditDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'client_id') {
      setEditedData(prev => {
        if (!prev) return null;
        return { ...prev, client_id: value };
      });
    } else if (name === 'date') {
      setEditedData(prev => {
        if (!prev) return null;
        return { ...prev, date: value };
      });
    } else if (['service', 'quantity', 'unit_price', 'vat'].includes(name)) {
      setEditedData(prev => updateFirstItem(
        prev, 
        name, 
        ['quantity', 'unit_price', 'vat'].includes(name) ? parseFloat(value) : value
      ));
    }
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
      
      {editMode && editedData ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Kunde</Label>
              <Input
                id="client_id"
                name="client_id"
                value={editedData.client_id}
                onChange={handleEditDataChange}
              />
            </div>
            
            {editedData.items[0] && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="service">Leistung</Label>
                  <Input
                    id="service"
                    name="service"
                    value={editedData.items[0].service}
                    onChange={handleEditDataChange}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Menge</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={editedData.items[0].quantity}
                      onChange={handleEditDataChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Einzelpreis</Label>
                    <Input
                      id="unit_price"
                      name="unit_price"
                      type="number"
                      step="0.01"
                      value={editedData.items[0].unit_price}
                      onChange={handleEditDataChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vat">MwSt. (%)</Label>
                    <Input
                      id="vat"
                      name="vat"
                      type="number"
                      step="0.01"
                      value={editedData.items[0].vat * 100}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) / 100;
                        setEditedData(prev => updateFirstItem(prev, 'vat', value));
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="date">Rechnungsdatum</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={editedData.date}
                onChange={handleEditDataChange}
              />
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                <X className="h-4 w-4" />
                Abbrechen
              </Button>
              
              <Button onClick={handleSaveEdit} className="gap-2">
                <Check className="h-4 w-4" />
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {invoiceId ? (
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-[600px] border-0"
                  title="Rechnungs-PDF"
                />
              ) : invoiceData && invoiceData.items[0] && (
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-medium">Rechnungsvorschau</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kunde</p>
                      <p>Kundennr.: {invoiceData.client_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Leistung</p>
                      <p>{invoiceData.items[0].service}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Menge</p>
                      <p>{invoiceData.items[0].quantity}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Einzelpreis</p>
                      <p>{invoiceData.items[0].unit_price.toFixed(2)} {invoiceData.currency || 'EUR'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">MwSt.</p>
                      <p>{(invoiceData.items[0].vat * 100).toFixed(0)}%</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gesamtpreis</p>
                      <p>{(invoiceData.items[0].quantity * invoiceData.items[0].unit_price).toFixed(2)} {invoiceData.currency || 'EUR'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rechnungsdatum</p>
                      <p>{new Date(invoiceData.date).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            {invoiceData && !invoiceId && (
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Bearbeiten
              </Button>
            )}
            
            {invoiceId && (
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2"
                disabled={!pdfUrl}
              >
                <Download className="h-4 w-4" />
                Herunterladen
              </Button>
            )}
            
            {invoiceId && (
              <Button
                onClick={() => setEmailDialogOpen(true)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Per E-Mail senden
              </Button>
            )}
          </div>
        </>
      )}
      
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
