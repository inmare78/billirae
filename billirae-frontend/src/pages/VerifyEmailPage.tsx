import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verified, setVerified] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Kein Verifizierungstoken gefunden.');
        setLoading(false);
        return;
      }

      try {
        console.log('Verifying email with token:', token);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setVerified(true);
      } catch (err) {
        setError('E-Mail-Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        setVerified(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>E-Mail verifizieren</CardTitle>
          <CardDescription>
            Bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Verifizierung läuft...</p>
            </div>
          ) : verified ? (
            <Alert className="mb-4">
              <AlertDescription>
                Ihre E-Mail wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!loading && (
            <Button asChild>
              <Link to="/login">Zur Anmeldung</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
