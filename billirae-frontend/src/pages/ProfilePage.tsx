import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { supabaseProfileService, ProfileData } from '../services/supabaseProfileService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { parseSupabaseError } from '../utils/supabaseErrorHandler';
import { logPageDebugInfo } from '../utils/logPage';

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
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          await logPageDebugInfo(window, 'Loading profile page');
        }
        
        const data = await supabaseProfileService.getProfile();
        setProfileData(data);
        
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(parseSupabaseError(err) || 'Fehler beim Laden des Profils.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logPageDebugInfo(window, 'Saving profile data');
      }
      
      if (logoFile) {
        setUploadingLogo(true);
        const logoUrl = await supabaseProfileService.uploadLogo(logoFile);
        setProfileData(prev => ({
          ...prev,
          logo_url: logoUrl
        }));
        setUploadingLogo(false);
      }
      
      await supabaseProfileService.updateProfile({
        ...profileData,
        logo_url: logoFile ? profileData.logo_url : (logoPreview || undefined)
      });
      
      setSuccess('Profil erfolgreich aktualisiert.');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(parseSupabaseError(err) || 'Fehler beim Aktualisieren des Profils.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Bitte wählen Sie ein Bild aus (JPG, PNG, GIF).');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Das Bild darf maximal 2MB groß sein.');
      return;
    }
    
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'LÖSCHEN') {
      setError('Bitte geben Sie "LÖSCHEN" ein, um Ihr Konto zu löschen.');
      return;
    }
    
    setIsDeleting(true);
    setError('');
    
    try {
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logPageDebugInfo(window, 'Deleting account');
      }
      
      await supabaseProfileService.deleteAccount();
      await supabase.auth.signOut();
      
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(parseSupabaseError(err) || 'Fehler beim Löschen des Kontos.');
      setIsDeleting(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logPageDebugInfo(window, 'Exporting user data');
      }
      
      const data = await supabaseProfileService.exportUserData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billirae-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting data:', err);
      setError(parseSupabaseError(err) || 'Fehler beim Exportieren der Daten.');
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
              {/* Logo upload section */}
              <div className="space-y-2">
                <Label htmlFor="logo">Firmenlogo</Label>
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800"
                  >
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo Vorschau" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400">Kein Logo</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? 'Wird hochgeladen...' : 'Logo auswählen'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      Max. 2MB (JPG, PNG, GIF)
                    </p>
                  </div>
                </div>
              </div>
              
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
      
      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konto löschen</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden unwiderruflich gelöscht.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Geben Sie "LÖSCHEN" ein, um zu bestätigen:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
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
              disabled={isDeleting || deleteConfirmation !== 'LÖSCHEN'}
            >
              {isDeleting ? 'Wird gelöscht...' : 'Konto löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
