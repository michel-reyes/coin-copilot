import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/app/lib/supabase';
import { generateHiddenEmail } from '@/app/lib/utils';
import { validateLunchMoneyApiKey } from '@/app/lib/lunchMoneyApi';
import { saveLunchMoneyApiKey, getLunchMoneyApiKey } from '@/app/lib/database';

const AuthContext = createContext<{
  signIn: (apiKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null;
  lunchMoneyApiKey: string | null;
  isLoading: boolean;
}>({
  signIn: async () => {},
  signOut: async () => {},
  session: null,
  lunchMoneyApiKey: null,
  isLoading: false,
});

// Use this hook to access the user info.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [lunchMoneyApiKey, setLunchMoneyApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      // If session exists, fetch the API key from database
      if (session) {
        getLunchMoneyApiKey()
          .then(apiKey => setLunchMoneyApiKey(apiKey))
          .catch(error => console.error('Error fetching API key:', error))
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // Fetch API key when user signs in
      if (session) {
        getLunchMoneyApiKey()
          .then(apiKey => setLunchMoneyApiKey(apiKey))
          .catch(error => console.error('Error fetching API key:', error));
      } else {
        setLunchMoneyApiKey(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (apiKey: string) => {
    try {
      setIsLoading(true);

      // Validate the API key
      const isValid = await validateLunchMoneyApiKey(apiKey);
      if (!isValid) {
        throw new Error('Invalid Lunch Money API key');
      }

      // Generate hidden email from API key
      const hiddenEmail = generateHiddenEmail(apiKey);

      // Try to sign in first (user might already exist)
      let { data, error } = await supabase.auth.signInWithPassword({
        email: hiddenEmail,
        password: apiKey,
      });

      // If sign in fails because user doesn't exist, sign up
      if (error && error.message.includes('Invalid login credentials')) {
        const signUpResult = await supabase.auth.signUp({
          email: hiddenEmail,
          password: apiKey,
        });

        // Handle the union type properly
        if (signUpResult.data.session && signUpResult.data.user) {
          data = {
            session: signUpResult.data.session,
            user: signUpResult.data.user
          };
        } else {
          data = { session: null, user: null };
        }
        error = signUpResult.error;
      }

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('Failed to create session');
      }

      // Save the API key to database
      await saveLunchMoneyApiKey(apiKey);

      // Update local state
      setSession(data.session);
      setLunchMoneyApiKey(apiKey);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setLunchMoneyApiKey(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext
      value={{
        signIn,
        signOut,
        session,
        lunchMoneyApiKey,
        isLoading,
      }}
    >
      {children}
    </AuthContext>
  );
}
