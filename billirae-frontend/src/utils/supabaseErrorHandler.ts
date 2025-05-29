/**
 * Utility for parsing and formatting Supabase error messages
 */

export const parseSupabaseError = (error: any): string | null => {
  if (!error) return null;
  
  if (error.message) {
    if (error.message.includes('Email not confirmed')) {
      return 'E-Mail-Adresse nicht bestätigt. Bitte prüfen Sie Ihren Posteingang.';
    }
    
    if (error.message.includes('Invalid login credentials')) {
      return 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
    }
    
    if (error.message.includes('User already registered')) {
      return 'Diese E-Mail-Adresse ist bereits registriert.';
    }
    
    if (error.message.includes('Password should be at least')) {
      return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
    }
    
    if (error.message.includes('Rate limit')) {
      return 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.';
    }
    
    return error.message;
  }
  
  if (error.error_description) {
    return error.error_description;
  }
  
  if (error.details) {
    return error.details;
  }
  
  if (error.hint) {
    return error.hint;
  }
  
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return 'Ein Eintrag mit diesen Daten existiert bereits.';
      case '23503': // foreign_key_violation
        return 'Der Eintrag kann nicht erstellt werden, da eine Referenz fehlt.';
      case '42P01': // undefined_table
        return 'Interner Datenbankfehler: Tabelle nicht gefunden.';
      case '42703': // undefined_column
        return 'Interner Datenbankfehler: Spalte nicht gefunden.';
      default:
        return `Datenbankfehler (${error.code})`;
    }
  }
  
  return 'Ein unbekannter Fehler ist aufgetreten.';
};

export default parseSupabaseError;
