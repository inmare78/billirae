import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (token) {
          setStatus('success');
          setMessage('Ihre E-Mail-Adresse wurde erfolgreich verifiziert.');
        } else {
          setStatus('error');
          setMessage('Ungültiger Verifizierungslink. Bitte fordern Sie einen neuen Link an.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">E-Mail Verifizierung</CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' ? 'Ihre E-Mail-Adresse wird verifiziert...' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p>Bitte warten Sie, während wir Ihre E-Mail-Adresse verifizieren...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-center">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6">
          {status !== 'loading' && (
            <Button asChild className="w-full">
              <Link to="/login">
                {status === 'success' ? 'Zum Login' : 'Zurück zum Login'}
              </Link>
            </Button>
          )}
          
          {status === 'error' && (
            <div className="text-center text-sm">
              <Link to="/resend-verification" className="text-primary hover:underline">
                Neuen Verifizierungslink anfordern
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
