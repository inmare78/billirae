import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabaseProfileService, ProfileData, UpcomingInvoice } from '../services/supabaseProfileService';
import { supabase } from '../services/supabaseClient';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className || ''}`}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className || ''}`}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ''}`}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    address: {
      street_1: '',
      street_2: '',
      house_number: '',
      zip: '',
      city: '',
      state: '',
      country: 'Deutschland',
    },
    tax_id: '',
    phone: '',
    bank_details: {
      bank_name: '',
      account_number: '',
      iban: '',
      bic: '',
    },
    settings: {
      default_vat: 0.19,
      default_currency: 'EUR',
      default_language: 'de',
      customer_prefix: 'CUST',
      inv_prefix: 'INV',
      inv_start_number: 1000,
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [reminderDays, setReminderDays] = useState<7 | 30>(7);
  const [upcomingInvoices, setUpcomingInvoices] = useState<UpcomingInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await supabaseProfileService.getProfile();
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Fehler beim Laden des Profils.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => {
        const parentObj = prev[parent as keyof ProfileData] as Record<string, unknown> || {};
        const result = { ...prev } as Record<string, unknown>;
        result[parent] = {
          ...parentObj,
          [child]: value
        };
        return result as ProfileData;
      });
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const result = await supabaseProfileService.updateProfile(profileData);
      setSuccess(result.message);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Aktualisieren des Profils.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await supabaseProfileService.exportUserData();
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `billirae-user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting user data:', err);
      setError('Fehler beim Exportieren der Daten.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      setError('Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen.');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await supabaseProfileService.deleteAccount();
      
      if (result.success) {
        await supabase.auth.signOut();
        
        navigate('/', { replace: true });
      } else {
        setError('Fehler beim Löschen des Kontos.');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Fehler beim Löschen des Kontos.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  const fetchUpcomingInvoices = async (days: 7 | 30) => {
    try {
      setLoadingInvoices(true);
      const invoices = await supabaseProfileService.getUpcomingInvoices(days);
      setUpcomingInvoices(invoices);
    } catch (err) {
      console.error('Error fetching upcoming invoices:', err);
      setError('Fehler beim Laden der fälligen Rechnungen.');
    } finally {
      setLoadingInvoices(false);
    }
  };
  
  useEffect(() => {
    fetchUpcomingInvoices(reminderDays);
  }, [reminderDays]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Unternehmensprofil</h1>
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 mb-8">
          <TabsTrigger value="company">Unternehmensdaten</TabsTrigger>
          <TabsTrigger value="invoice">Rechnungseinstellungen</TabsTrigger>
          <TabsTrigger value="statistics">Umsatzstatistik</TabsTrigger>
          <TabsTrigger value="reminders">Fälligkeiten</TabsTrigger>
          <TabsTrigger value="favorites">Favoriten</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>
        
        {/* Unternehmensdaten & rechtliche Angaben */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Stammdaten</CardTitle>
              <CardDescription>
                Diese Informationen werden auf Ihren Rechnungen angezeigt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {success && (
                  <Alert className="mb-4">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                {error && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Firmenname</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={profileData.company_name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Vorname</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={profileData.first_name || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nachname</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={profileData.last_name || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email || ''}
                      onChange={handleChange}
                      required
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Die E-Mail-Adresse kann nicht geändert werden.</p>
                  </div>
                  
                  <h3 className="font-semibold text-lg pt-2">Adresse</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="address.street_1">Straße</Label>
                      <Input
                        id="address.street_1"
                        name="address.street_1"
                        value={profileData.address?.street_1 || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address.house_number">Hausnummer</Label>
                      <Input
                        id="address.house_number"
                        name="address.house_number"
                        value={profileData.address?.house_number || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address.street_2">Adresszusatz</Label>
                    <Input
                      id="address.street_2"
                      name="address.street_2"
                      value={profileData.address?.street_2 || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="address.zip">PLZ</Label>
                      <Input
                        id="address.zip"
                        name="address.zip"
                        value={profileData.address?.zip || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address.city">Ort</Label>
                      <Input
                        id="address.city"
                        name="address.city"
                        value={profileData.address?.city || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="address.state">Bundesland</Label>
                      <Input
                        id="address.state"
                        name="address.state"
                        value={profileData.address?.state || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address.country">Land</Label>
                      <Input
                        id="address.country"
                        name="address.country"
                        value={profileData.address?.country || 'Deutschland'}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Steuernummer</Label>
                    <Input
                      id="tax_id"
                      name="tax_id"
                      value={profileData.tax_id || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <h3 className="font-semibold text-lg pt-2">Bankverbindung</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bank_details.bank_name">Bank</Label>
                    <Input
                      id="bank_details.bank_name"
                      name="bank_details.bank_name"
                      value={profileData.bank_details?.bank_name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bank_details.iban">IBAN</Label>
                      <Input
                        id="bank_details.iban"
                        name="bank_details.iban"
                        value={profileData.bank_details?.iban || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bank_details.bic">BIC</Label>
                      <Input
                        id="bank_details.bic"
                        name="bank_details.bic"
                        value={profileData.bank_details?.bic || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 w-full" disabled={saving}>
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Rechnungs-Einstellungen */}
        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Rechnungseinstellungen</CardTitle>
              <CardDescription>
                Passen Sie die Standardeinstellungen für Ihre Rechnungen an.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {success && (
                  <Alert className="mb-4">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                {error && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settings.default_vat">Standard-MwSt (%)</Label>
                      <Input
                        id="settings.default_vat"
                        name="settings.default_vat"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={profileData.settings?.default_vat || 0.19}
                        onChange={handleChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Als Dezimalwert eingeben (z.B. 0.19 für 19%)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="settings.default_currency">Währung</Label>
                      <Input
                        id="settings.default_currency"
                        name="settings.default_currency"
                        value={profileData.settings?.default_currency || 'EUR'}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="settings.inv_prefix">Rechnungspräfix</Label>
                      <Input
                        id="settings.inv_prefix"
                        name="settings.inv_prefix"
                        value={profileData.settings?.inv_prefix || 'INV'}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="settings.inv_start_number">Startnummer</Label>
                      <Input
                        id="settings.inv_start_number"
                        name="settings.inv_start_number"
                        type="number"
                        min="1"
                        value={profileData.settings?.inv_start_number || 1000}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="settings.customer_prefix">Kundenpräfix</Label>
                      <Input
                        id="settings.customer_prefix"
                        name="settings.customer_prefix"
                        value={profileData.settings?.customer_prefix || 'CUST'}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="settings.inv_footer_text">Rechnungsfußzeile</Label>
                    <Textarea
                      id="settings.inv_footer_text"
                      name="settings.inv_footer_text"
                      value={profileData.settings?.inv_footer_text || ''}
                      onChange={handleChange}
                      placeholder="z.B. Zahlungsbedingungen, Steuernummer, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="settings.email_signature">E-Mail-Signatur</Label>
                    <Textarea
                      id="settings.email_signature"
                      name="settings.email_signature"
                      value={profileData.settings?.email_signature || ''}
                      onChange={handleChange}
                      placeholder="Ihre E-Mail-Signatur für Rechnungs-E-Mails"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 w-full" disabled={saving}>
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Umsatz- und Rechnungsstatistik */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Umsatzstatistik</CardTitle>
              <CardDescription>
                Übersicht über Ihre Umsätze und Rechnungen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Jan', umsatz: 0 },
                      { name: 'Feb', umsatz: 0 },
                      { name: 'Mär', umsatz: 0 },
                      { name: 'Apr', umsatz: 0 },
                      { name: 'Mai', umsatz: 0 },
                      { name: 'Jun', umsatz: 0 },
                      { name: 'Jul', umsatz: 0 },
                      { name: 'Aug', umsatz: 0 },
                      { name: 'Sep', umsatz: 0 },
                      { name: 'Okt', umsatz: 0 },
                      { name: 'Nov', umsatz: 0 },
                      { name: 'Dez', umsatz: 0 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} €`, 'Umsatz']} />
                    <Bar dataKey="umsatz" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-4">Rechnungsstatistik</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Offene Rechnungen</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Bezahlte Rechnungen</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Überfällige Rechnungen</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                    <p className="text-2xl font-bold">0 €</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Nächste Fälligkeiten / Erinnerungen */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Fälligkeiten &amp; Erinnerungen</CardTitle>
              <CardDescription>
                Übersicht über anstehende Zahlungen und Erinnerungen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Anstehende Zahlungen</h3>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="reminder-days" className="mr-2">Zeitraum:</Label>
                    <select
                      id="reminder-days"
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
                      value={reminderDays}
                      onChange={(e) => setReminderDays(Number(e.target.value) as 7 | 30)}
                    >
                      <option value={7}>Nächste 7 Tage</option>
                      <option value={30}>Nächste 30 Tage</option>
                    </select>
                  </div>
                </div>
                
                {loadingInvoices ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : upcomingInvoices.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Rechnungsnr.</th>
                          <th className="px-4 py-2 text-left">Kunde</th>
                          <th className="px-4 py-2 text-left">Fällig am</th>
                          <th className="px-4 py-2 text-right">Betrag</th>
                          <th className="px-4 py-2 text-center">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-t border-border">
                            <td className="px-4 py-3">{invoice.inv_number}</td>
                            <td className="px-4 py-3">{invoice.client_name}</td>
                            <td className="px-4 py-3">
                              {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de })}
                            </td>
                            <td className="px-4 py-3 text-right">{invoice.amount.toFixed(2)} €</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button variant="outline" size="sm">
                                  Ansehen
                                </Button>
                                <Button variant="outline" size="sm">
                                  Erinnern
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="p-6 text-center text-muted-foreground">
                      Keine anstehenden Zahlungen in den nächsten {reminderDays} Tagen.
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-4">Erinnerungen einrichten</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatische Erinnerungen für fällige Rechnungen können hier konfiguriert werden.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="remind-3-days" className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="remind-3-days">3 Tage vor Fälligkeit erinnern</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="remind-due-date" className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="remind-due-date">Am Fälligkeitstag erinnern</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="remind-overdue" className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="remind-overdue">Bei überfälligen Rechnungen erinnern</Label>
                    </div>
                  </div>
                  <Button className="mt-4" variant="outline">Einstellungen speichern</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Favoriten / häufige Kunden */}
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favoriten &amp; häufige Kunden</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre häufig verwendeten Kunden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input placeholder="Kunde suchen..." className="flex-1" />
                  <Button>Hinzufügen</Button>
                </div>
                
                <div className="border rounded-md">
                  <div className="p-4 text-center text-muted-foreground">
                    Keine Favoriten vorhanden.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Export- und Backup-Funktionen */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export &amp; Backup</CardTitle>
              <CardDescription>
                Exportieren Sie Ihre Daten oder erstellen Sie ein Backup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Datenexport (GDPR)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exportieren Sie alle Ihre persönlichen Daten gemäß DSGVO.
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    Daten exportieren (JSON)
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Rechnungsexport</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exportieren Sie Ihre Rechnungsdaten in verschiedenen Formaten.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline">Rechnungen als CSV</Button>
                    <Button variant="outline">Rechnungen als PDF-Archiv</Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Kundenexport</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exportieren Sie Ihre Kundendaten.
                  </p>
                  <Button variant="outline">Kunden als CSV</Button>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Konto löschen</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Löschen Sie Ihr Konto und alle zugehörigen Daten.
                  </p>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        Konto löschen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Konto löschen</DialogTitle>
                        <DialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden unwiderruflich gelöscht.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p>Geben Sie "LÖSCHEN" ein, um zu bestätigen:</p>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="LÖSCHEN"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          Abbrechen
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText !== 'LÖSCHEN'}
                        >
                          {isDeleting ? 'Wird gelöscht...' : 'Konto endgültig löschen'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integrationseinstellungen */}
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Integrationseinstellungen</CardTitle>
              <CardDescription>
                Verwalten Sie externe Integrationen und API-Verbindungen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Supabase-Verbindung</h3>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-green-500"></div>
                    <p>Verbunden</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    User ID: {profileData.user_id || 'Nicht verfügbar'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">API-Schlüssel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verwalten Sie Ihre API-Schlüssel für externe Integrationen.
                  </p>
                  <Button variant="outline">API-Schlüssel generieren</Button>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Webhooks</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Konfigurieren Sie Webhooks für automatisierte Workflows.
                  </p>
                  <div className="border rounded-md">
                    <div className="p-4 text-center text-muted-foreground">
                      Keine Webhooks konfiguriert.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
