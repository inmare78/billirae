import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { parseSupabaseError } from '../utils/supabaseErrorHandler';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          setError(parseSupabaseError(error));
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(parseSupabaseError(error));
        return { success: false, error: parseSupabaseError(error) };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        setError(parseSupabaseError(error));
        return { success: false, error: parseSupabaseError(error) };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(parseSupabaseError(error));
      }
    } catch (err) {
      setError('Ein Fehler ist beim Abmelden aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    login,
    register,
    logout,
    resetError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
