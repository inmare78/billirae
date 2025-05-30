import { AuthError } from '@supabase/supabase-js';

/**
 * Wandelt Supabase-Fehlermeldungen in benutzerfreundliche Texte um.
 * Gibt garantiert immer einen string zurück, auch wenn die Fehlerstruktur nicht erwartungsgemäß ist.
 */
export function parseSupabaseError(error: AuthError | null | undefined): string {
  if (!error) {
    return 'Ein unbekannter Fehler ist aufgetreten.';
  }

  const rawMessage = error.message ?? '';

  // Beispiel für benutzerfreundliche Übersetzungen
  if (rawMessage.includes('Invalid login credentials')) {
    return 'E-Mail oder Passwort sind falsch.';
  }

  if (rawMessage.includes('User already registered')) {
    return 'Diese E-Mail ist bereits registriert.';
  }

  if (rawMessage.includes('Email not confirmed')) {
    return 'Bitte bestätige deine E-Mail-Adresse vor dem Login.';
  }

  // Default
  return rawMessage || 'Ein unbekannter Fehler ist aufgetreten.';
}
