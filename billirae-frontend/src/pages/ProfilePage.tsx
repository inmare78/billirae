import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabaseProfileService } from '../services/supabaseProfileService';

interface ProfileData {
  id?: string;
  company_name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  street_1?: string;
  street_2?: string;
  zip?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  tax_id?: string;
  website_url?: string;
  logo_url?: string;
  is_pro_user?: boolean;
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    company_name: '',
    email: '',
    first_name: '',
    last_name: '',
    street_1: '',
    street_2: '',
    zip: '',
    city: '',
    state: '',
    country: '',
    country_code: '',
    tax_id: '',
    website_url: '',
    logo_url: '',
    is_pro_user: false,
    bank_name: '',
    bank_iban: '',
    bank_bic: '',
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
      if (!user?.id) return;
      
      try {
        const data = await supabaseProfileService.getUserProfile(user.id);
        setProfileData({
          ...profileData,
          ...data,
          email: user.email || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Fehler beim Laden des Profils.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await supabaseProfileService.updateUserProfile(user.id, profileData);
      setSuccess('Profil erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Aktualisieren des Profils.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportData = async () => {
    if (!user?.id) return;
    
    try {
      const exportData = await supabaseProfileService.exportUserData(user.id);
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `billirae-profile-export-${user.id}.json`;
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
    if (!user?.id) return;
    if (deleteConfirmText !== 'LÖSCHEN') return;
    
    setIsDeleting(true);
    
    try {
      await supabaseProfileService.deleteUserAccount(user.id);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Fehler beim Löschen des Kontos.');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nachname</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={profileData.last_name || ''}
                    onChange={handleChange}
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
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="street_1">Adresse</Label>
                <Input
                  id="street_1"
                  name="street_1"
                  value={profileData.street_1 || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="street_2">Adresszusatz</Label>
                <Input
                  id="street_2"
                  name="street_2"
                  value={profileData.street_2 || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="zip">PLZ</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={profileData.zip || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    name="city"
                    value={profileData.city || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">Bundesland</Label>
                  <Input
                    id="state"
                    name="state"
                    value={profileData.state || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    name="country"
                    value={profileData.country || ''}
                    onChange={handleChange}
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="url"
                  value={profileData.website_url || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo_url">Firmenlogo</Label>
                <div className="flex items-center gap-4">
                  {profileData.logo_url && (
                    <img 
                      src={profileData.logo_url} 
                      alt="Firmenlogo" 
                      className="w-16 h-16 object-contain border rounded"
                    />
                  )}
                  <Button type="button" variant="outline" size="sm">
                    Logo auswählen
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-lg pt-2">Bankverbindung</h3>
              
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={profileData.bank_name || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">IBAN</Label>
                  <Input
                    id="bank_iban"
                    name="bank_iban"
                    value={profileData.bank_iban || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_bic">BIC</Label>
                  <Input
                    id="bank_bic"
                    name="bank_bic"
                    value={profileData.bank_bic || ''}
                    onChange={handleChange}
                  />
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
          
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Konto löschen
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konto löschen</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4 text-sm">
              Bitte geben Sie <strong>LÖSCHEN</strong> ein, um zu bestätigen:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="LÖSCHEN"
              className="mb-4"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'LÖSCHEN' || isDeleting}
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
