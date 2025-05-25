import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { userService } from '../services/api';

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
}

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
      await userService.updateProfile(profileData);
      setSuccess('Profil erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Aktualisieren des Profils.');
    } finally {
      setSaving(false);
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
          <Button variant="outline" asChild>
            <a href="/api/users/export" download>
              Daten exportieren (GDPR)
            </a>
          </Button>
          
          <Button variant="destructive">
            Konto löschen
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage;
