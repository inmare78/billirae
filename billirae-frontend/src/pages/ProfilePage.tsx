import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api, { userService } from '../services/api';

const companyFormSchema = z.object({
  company_name: z.string().optional(),
  first_name: z.string().min(2, { message: 'Vorname muss mindestens 2 Zeichen lang sein' }),
  last_name: z.string().min(2, { message: 'Nachname muss mindestens 2 Zeichen lang sein' }),
  tax_id: z.string().optional(),
  street: z.string().min(3, { message: 'Straße muss mindestens 3 Zeichen lang sein' }),
  city: z.string().min(2, { message: 'Stadt muss mindestens 2 Zeichen lang sein' }),
  zip: z.string().min(4, { message: 'PLZ muss mindestens 4 Zeichen lang sein' }),
  country: z.string().default('Deutschland'),
  account_holder: z.string().min(2, { message: 'Kontoinhaber muss mindestens 2 Zeichen lang sein' }),
  iban: z.string().min(15, { message: 'IBAN muss mindestens 15 Zeichen lang sein' }),
  bic: z.string().optional(),
  invoice_prefix: z.string().optional(),
  next_invoice_number: z.number().int().positive().default(1),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema) as any,
    defaultValues: {
      company_name: '',
      first_name: '',
      last_name: '',
      tax_id: '',
      street: '',
      city: '',
      zip: '',
      country: 'Deutschland',
      account_holder: '',
      iban: '',
      bic: '',
      invoice_prefix: '',
      next_invoice_number: 1,
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await userService.getProfile();
        
        form.reset({
          company_name: userData.company_name || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          tax_id: userData.tax_id || '',
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          zip: userData.address?.zip || '',
          country: userData.address?.country || 'Deutschland',
          account_holder: userData.bank_details?.account_holder || '',
          iban: userData.bank_details?.iban || '',
          bic: userData.bank_details?.bic || '',
          invoice_prefix: userData.settings?.invoice_prefix || '',
          next_invoice_number: userData.settings?.next_invoice_number || 1,
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Fehler beim Laden des Profils. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [form]);

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const profileData = {
        company_name: data.company_name,
        first_name: data.first_name,
        last_name: data.last_name,
        tax_id: data.tax_id,
        address: {
          street: data.street,
          city: data.city,
          zip: data.zip,
          country: data.country,
        },
        bank_details: {
          account_holder: data.account_holder,
          iban: data.iban,
          bic: data.bic,
        },
        settings: {
          invoice_prefix: data.invoice_prefix,
          next_invoice_number: data.next_invoice_number,
        },
      };
      
      await userService.updateProfile(profileData);
      setSuccess('Profil erfolgreich aktualisiert');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Fehler beim Aktualisieren des Profils. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Profil & Einstellungen</h1>
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="company">Unternehmensdaten</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="privacy">Datenschutz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Unternehmensdaten</CardTitle>
              <CardDescription>
                Diese Informationen werden auf Ihren Rechnungen und in E-Mails verwendet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firmenname</FormLabel>
                          <FormControl>
                            <Input placeholder="Ihre Firma GmbH" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional, wenn Sie als Einzelperson arbeiten
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control as any}
                      name="tax_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Steuernummer / USt-ID</FormLabel>
                          <FormControl>
                            <Input placeholder="DE123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control as any}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorname</FormLabel>
                          <FormControl>
                            <Input placeholder="Max" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control as any}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nachname</FormLabel>
                          <FormControl>
                            <Input placeholder="Mustermann" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="mb-4 text-lg font-medium">Adresse</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control as any}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Straße und Hausnummer</FormLabel>
                            <FormControl>
                              <Input placeholder="Musterstraße 123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control as any}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PLZ</FormLabel>
                              <FormControl>
                                <Input placeholder="12345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control as any}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stadt</FormLabel>
                              <FormControl>
                                <Input placeholder="Berlin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control as any}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Land</FormLabel>
                            <FormControl>
                              <Input placeholder="Deutschland" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="mb-4 text-lg font-medium">Bankverbindung</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control as any}
                        name="account_holder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kontoinhaber</FormLabel>
                            <FormControl>
                              <Input placeholder="Max Mustermann" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control as any}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input placeholder="DE89 3704 0044 0532 0130 00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control as any}
                        name="bic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BIC (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="BYLADEM1001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
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
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                      {!isLoading && <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Rechnungseinstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihre Rechnungsnummern und andere Einstellungen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="invoice_prefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rechnungspräfix</FormLabel>
                          <FormControl>
                            <Input placeholder="RE-" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional, z.B. "RE-" für Rechnungsnummern wie RE-001
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control as any}
                      name="next_invoice_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nächste Rechnungsnummer</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Die nächste zu verwendende Rechnungsnummer
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                      {!isLoading && <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Datenschutz & DSGVO</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre persönlichen Daten gemäß der DSGVO.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Datenexport</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Laden Sie alle Ihre persönlichen Daten und Rechnungen als JSON-Datei herunter.
                </p>
                <Button variant="outline" onClick={() => userService.exportUserData()}>Daten exportieren</Button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Datenlöschung</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Löschen Sie Ihr Konto und alle zugehörigen Daten. Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <Button variant="destructive" onClick={() => confirm('Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.') && userService.deleteAccount()}>Konto löschen</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
