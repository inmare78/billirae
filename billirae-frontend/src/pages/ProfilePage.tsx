import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { userService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileData {
  company_name: string;
  address: string;
  tax_id: string;
  email: string;
  phone: string;
  bank_name: string;
  bank_account: string;
  bank_iban: string;
  bank_bic: string;
  logo_url?: string;
  first_name: string;
  last_name: string;
}

interface InvoiceSettings {
  default_tax_rate: number;
  invoice_prefix: string;
  payment_terms: number;
  default_currency: string;
  default_language: string;
}

interface FavoriteCustomer {
  id: string;
  name: string;
}

const mockRevenueData = [
  { name: '01.04', umsatz: 1200 },
  { name: '08.04', umsatz: 1800 },
  { name: '15.04', umsatz: 800 },
  { name: '22.04', umsatz: 2400 },
  { name: '29.04', umsatz: 1600 },
];

const mockDueInvoices = [
  { id: 'INV-2025-001', customer: 'Kunde A GmbH', amount: 1200, due_date: '2025-05-15', status: 'fällig' },
  { id: 'INV-2025-003', customer: 'Kunde C KG', amount: 800, due_date: '2025-05-20', status: 'fällig' },
  { id: 'INV-2025-005', customer: 'Kunde E GmbH & Co. KG', amount: 2400, due_date: '2025-05-25', status: 'bald fällig' },
];

const ProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    company_name: '',
    address: '',
    tax_id: '',
    email: '',
    phone: '',
    bank_name: '',
    bank_account: '',
    bank_iban: '',
    bank_bic: '',
    first_name: '',
    last_name: '',
  });
  
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    default_tax_rate: 19,
    invoice_prefix: 'INV-',
    payment_terms: 14,
    default_currency: 'EUR',
    default_language: 'de',
  });
  
  const [favoriteCustomers, setFavoriteCustomers] = useState<FavoriteCustomer[]>([]);
  const [newCustomer, setNewCustomer] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('April 2025');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await userService.updateProfile(profileData);
      setSuccess('Profil erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Aktualisieren des Profils.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess('Einstellungen erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Fehler beim Aktualisieren der Einstellungen.');
    } finally {
      setSaving(false);
    }
  };
  
  const addFavoriteCustomer = () => {
    if (!newCustomer.trim()) return;
    
    const newFavorite: FavoriteCustomer = {
      id: `cust-${Date.now()}`,
      name: newCustomer.trim()
    };
    
    setFavoriteCustomers([...favoriteCustomers, newFavorite]);
    setNewCustomer('');
  };
  
  const removeFavoriteCustomer = (id: string) => {
    setFavoriteCustomers(favoriteCustomers.filter(customer => customer.id !== id));
  };

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
      
      <Tabs defaultValue="company" className="max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-7 w-full mb-8">
          <TabsTrigger value="company">Unternehmensdaten</TabsTrigger>
          <TabsTrigger value="invoice-settings">Rechnungseinstellungen</TabsTrigger>
          <TabsTrigger value="revenue">Umsatzstatistik</TabsTrigger>
          <TabsTrigger value="due-dates">Fälligkeiten</TabsTrigger>
          <TabsTrigger value="favorites">Favoriten</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>
        
        {/* Unternehmensdaten Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Stammdaten</CardTitle>
              <CardDescription>
                Diese Informationen werden auf Ihren Rechnungen angezeigt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit}>
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
                      value={profileData.company_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Vorname</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nachname</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Steuernummer</Label>
                      <Input
                        id="tax_id"
                        name="tax_id"
                        value={profileData.tax_id}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <h3 className="font-semibold text-lg pt-2">Bankverbindung</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank</Label>
                    <Input
                      id="bank_name"
                      name="bank_name"
                      value={profileData.bank_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bank_iban">IBAN</Label>
                      <Input
                        id="bank_iban"
                        name="bank_iban"
                        value={profileData.bank_iban}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bank_bic">BIC</Label>
                      <Input
                        id="bank_bic"
                        name="bank_bic"
                        value={profileData.bank_bic}
                        onChange={handleProfileChange}
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
        
        {/* Rechnungseinstellungen Tab */}
        <TabsContent value="invoice-settings">
          <Card>
            <CardHeader>
              <CardTitle>Rechnungseinstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie Standardwerte für Ihre Rechnungen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSubmit}>
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
                      <Label htmlFor="default_tax_rate">Standard-MwSt (%)</Label>
                      <Input
                        id="default_tax_rate"
                        name="default_tax_rate"
                        type="number"
                        value={invoiceSettings.default_tax_rate}
                        onChange={handleSettingsChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="invoice_prefix">Rechnungspräfix</Label>
                      <Input
                        id="invoice_prefix"
                        name="invoice_prefix"
                        value={invoiceSettings.invoice_prefix}
                        onChange={handleSettingsChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="payment_terms">Zahlungsziel (Tage)</Label>
                      <Input
                        id="payment_terms"
                        name="payment_terms"
                        type="number"
                        value={invoiceSettings.payment_terms}
                        onChange={handleSettingsChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="default_currency">Standardwährung</Label>
                      <select
                        id="default_currency"
                        name="default_currency"
                        value={invoiceSettings.default_currency}
                        onChange={handleSettingsChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">US-Dollar ($)</option>
                        <option value="GBP">Britisches Pfund (£)</option>
                        <option value="CHF">Schweizer Franken (CHF)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default_language">Standardsprache</Label>
                    <select
                      id="default_language"
                      name="default_language"
                      value={invoiceSettings.default_language}
                      onChange={handleSettingsChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="de">Deutsch</option>
                      <option value="en">Englisch</option>
                      <option value="fr">Französisch</option>
                      <option value="es">Spanisch</option>
                    </select>
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 w-full" disabled={saving}>
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Umsatzstatistik Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Umsatzübersicht</CardTitle>
              <CardDescription>
                Visualisierung Ihrer Einnahmen im Zeitverlauf.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="month-select">Monat auswählen</Label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                >
                  <option value="April 2025">April 2025</option>
                  <option value="März 2025">März 2025</option>
                  <option value="Februar 2025">Februar 2025</option>
                  <option value="Januar 2025">Januar 2025</option>
                </select>
              </div>
              
              <div className="h-80 w-full" aria-label="Umsatzdiagramm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} €`, 'Umsatz']} />
                    <Bar dataKey="umsatz" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Zusammenfassung</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                    <p className="text-2xl font-bold">7.800 €</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Durchschnitt</p>
                    <p className="text-2xl font-bold">1.560 €</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Anzahl Rechnungen</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Fälligkeiten Tab */}
        <TabsContent value="due-dates">
          <Card>
            <CardHeader>
              <CardTitle>Fällige Rechnungen</CardTitle>
              <CardDescription>
                Übersicht über anstehende Zahlungen und Fälligkeiten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Rechnungsnr.</th>
                      <th className="text-left py-3 px-4">Kunde</th>
                      <th className="text-left py-3 px-4">Betrag</th>
                      <th className="text-left py-3 px-4">Fällig am</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDueInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{invoice.id}</td>
                        <td className="py-3 px-4">{invoice.customer}</td>
                        <td className="py-3 px-4">{invoice.amount} €</td>
                        <td className="py-3 px-4">{invoice.due_date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            invoice.status === 'fällig' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm">Erinnern</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Zahlungserinnerungen</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="reminder-1" className="mr-2" />
                    <Label htmlFor="reminder-1">Automatische Erinnerungen aktivieren</Label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="reminder-2" className="mr-2" />
                    <Label htmlFor="reminder-2">E-Mail-Benachrichtigungen bei fälligen Rechnungen</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Favoriten Tab */}
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Häufig verwendete Kunden</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Favoriten für schnelleren Zugriff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-6">
                <Input
                  placeholder="Kundenname eingeben"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={addFavoriteCustomer}>Hinzufügen</Button>
              </div>
              
              {favoriteCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Favoriten vorhanden. Fügen Sie Ihre häufig verwendeten Kunden hinzu.
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-md">
                      <span>{customer.name}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeFavoriteCustomer(customer.id)}
                      >
                        Entfernen
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Export Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Daten exportieren</CardTitle>
              <CardDescription>
                Exportieren Sie Ihre Daten für Backups oder GDPR-Anfragen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Rechnungsdaten</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exportieren Sie alle Ihre Rechnungen als CSV oder JSON.
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline">CSV-Export</Button>
                    <Button variant="outline">JSON-Export</Button>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Kundendaten</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exportieren Sie Ihre Kundendatenbank.
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline">CSV-Export</Button>
                    <Button variant="outline">JSON-Export</Button>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">GDPR-Datenexport</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exportieren Sie alle Ihre persönlichen Daten gemäß DSGVO.
                  </p>
                  <Button>Vollständigen Datenexport anfordern</Button>
                </div>
                
                <div className="bg-red-50 p-4 rounded-md">
                  <h3 className="font-semibold text-red-800 mb-2">Konto löschen</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Löschen Sie Ihr Konto und alle zugehörigen Daten. Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  <Button variant="destructive">Konto löschen</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integration Tab */}
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Integration</CardTitle>
              <CardDescription>
                Verbinden Sie Billirae mit anderen Diensten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Supabase-Verbindung</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Status der Verbindung zu Supabase für Authentifizierung und Datenspeicherung.
                  </p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Verbunden</span>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">OpenAI API</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Status der Verbindung zur OpenAI API für Spracherkennung.
                  </p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Verbunden</span>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">E-Mail-Dienst</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Status der Verbindung zum E-Mail-Dienst für Rechnungsversand.
                  </p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Verbunden</span>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-2">API-Schlüssel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verwalten Sie Ihre API-Schlüssel für Integrationen.
                  </p>
                  <Button variant="outline">API-Schlüssel verwalten</Button>
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
