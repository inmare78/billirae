/**
 * Utility for handling Supabase API errors and providing user-friendly messages
 */

interface SupabaseError {
  message?: string;
  error?: string;
  error_description?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

/**
 * Parses a Supabase error and returns a user-friendly message
 * @param error - The error object returned by Supabase
 * @returns A user-friendly error message in German
 */
export function parseSupabaseError(error: unknown): string {
  const fallbackMessage = "Ein unerwarteter Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.";
  
  if (!error) return fallbackMessage;
  
  const supabaseError = extractErrorObject(error);
  
  if (!supabaseError) return fallbackMessage;
  
  return getReadableErrorMessage(supabaseError);
}

/**
 * Extracts the error object from various Supabase error structures
 */
function extractErrorObject(error: unknown): SupabaseError | null {
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    
    if (err.error) {
      return typeof err.error === 'string' 
        ? { message: err.error } 
        : err.error;
    }
    
    if (err.message) {
      return { message: err.message };
    }
    
    if (err.data && err.data.error) {
      return typeof err.data.error === 'string'
        ? { message: err.data.error }
        : err.data.error;
    }
  }
  
  return null;
}

/**
 * Maps error codes/messages to user-friendly German messages
 */
function getReadableErrorMessage(error: SupabaseError): string {
  const message = error.message || error.error || error.error_description || '';
  const code = error.code || '';
  const status = error.status || 0;
  
  if (message.includes('Invalid login credentials') || code === 'invalid_credentials') {
    return 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
  }
  
  if (message.includes('Email not confirmed') || code === 'email_not_confirmed') {
    return 'Ihre E-Mail-Adresse wurde noch nicht bestätigt. Bitte prüfen Sie Ihren Posteingang.';
  }
  
  if (message.includes('User already registered') || code === 'user_already_registered') {
    return 'Diese E-Mail-Adresse ist bereits registriert. Bitte versuchen Sie sich anzumelden.';
  }
  
  if (message.includes('Password should be') || message.includes('password')) {
    return 'Das Passwort entspricht nicht den Anforderungen. Es sollte mindestens 8 Zeichen lang sein und Zahlen sowie Sonderzeichen enthalten.';
  }
  
  if (message.includes('rate limit') || code === 'too_many_requests' || status === 429) {
    return 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.';
  }
  
  if (message.includes('permission denied') || message.includes('not authorized')) {
    return 'Sie haben keine Berechtigung für diese Aktion.';
  }
  
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'Ein Eintrag mit diesen Daten existiert bereits.';
  }
  
  if (message.includes('not found') || status === 404) {
    return 'Die angeforderte Ressource wurde nicht gefunden.';
  }
  
  if (message.includes('network') || status === 0) {
    return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  }
  
  if (status >= 500) {
    return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
  }
  
  if (message) {
    return `Fehler: ${message}`;
  }
  
  return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
}
