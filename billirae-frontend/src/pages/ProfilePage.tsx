import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { supabaseProfileService, ProfileData } from '../services/supabaseProfileService';
import { supabase } from '../services/supabaseClient';

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
      
      <Card className="max-w-2xl mx-auto">
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
              
              <h3 className="font-semibold text-lg pt-2">Rechnungseinstellungen</h3>
              
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
            </div>
            
            <Button type="submit" className="mt-6 w-full" disabled={saving}>
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleExportData}>
            Daten exportieren (GDPR)
          </Button>
          
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage;
