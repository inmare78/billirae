import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { supabaseProfileService, ProfileData } from '../services/supabaseProfileService';
import { supabase } from '../services/supabaseClient';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
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
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (profileData.bank_iban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(profileData.bank_iban)) {
      errors.bank_iban = 'Bitte geben Sie eine gültige IBAN ein.';
    }
    
    if (profileData.bank_bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(profileData.bank_bic)) {
      errors.bank_bic = 'Bitte geben Sie einen gültigen BIC ein.';
    }
    
    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    
    if (profileData.phone && !/^[+]?[0-9\s-]{8,}$/.test(profileData.phone)) {
      errors.phone = 'Bitte geben Sie eine gültige Telefonnummer ein.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await supabaseProfileService.updateProfile(profileData);
      setSuccess('Profil erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Aktualisieren des Profils.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      const userData = await supabaseProfileService.exportUserData();
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `billirae-user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (err) {
      console.error('Error exporting user data:', err);
      setError('Fehler beim Exportieren der Benutzerdaten.');
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      setError('Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen.');
      return;
    }
    
    setIsDeleting(true);
    setError('');
    
    try {
      await supabaseProfileService.deleteAccount();
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Fehler beim Löschen des Kontos.');
      setIsDeleting(false);
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
                  value={profileData.company_name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-destructive">{validationErrors.phone}</p>
                )}
              </div>
              
              <h3 className="font-semibold text-lg pt-2">Bankverbindung</h3>
              
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={profileData.bank_name}
                  onChange={handleChange}
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
                    onChange={handleChange}
                    required
                  />
                  {validationErrors.bank_iban && (
                    <p className="text-sm text-destructive">{validationErrors.bank_iban}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_bic">BIC</Label>
                  <Input
                    id="bank_bic"
                    name="bank_bic"
                    value={profileData.bank_bic}
                    onChange={handleChange}
                    required
                  />
                  {validationErrors.bank_bic && (
                    <p className="text-sm text-destructive">{validationErrors.bank_bic}</p>
                  )}
                </div>
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
          
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            Konto löschen
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konto löschen</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen:</p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="LÖSCHEN"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Wird gelöscht...' : 'Konto endgültig löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
