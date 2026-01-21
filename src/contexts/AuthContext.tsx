import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'judge' | 'team';

interface AuthUser {
  role: UserRole;
  id: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (role: UserRole, credentials: { email?: string; password?: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          role: 'admin',
          id: session.user.id,
          name: 'Admin',
          email: session.user.email
        };
        setUser(authUser);
        localStorage.setItem('authUser', JSON.stringify(authUser));
      } else {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role !== 'admin') {
            setUser(parsed);
          }
        }
      }
    });

    setLoading(false);

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (role: UserRole, credentials: { email?: string; password?: string; name?: string }) => {
    if (role === 'admin') {
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password required for admin login');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      const authUser: AuthUser = {
        role: 'admin',
        id: data.user.id,
        name: 'Admin',
        email: data.user.email
      };
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    } else if (role === 'judge') {
      if (!credentials.name) {
        throw new Error('Name required for judge login');
      }

      const { data: judge, error } = await supabase
        .from('judges')
        .select('*')
        .eq('name', credentials.name)
        .maybeSingle();

      if (error) throw error;
      if (!judge) {
        throw new Error('Judge not found');
      }

      const authUser: AuthUser = {
        role: 'judge',
        id: judge.id,
        name: judge.name
      };
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    } else if (role === 'team') {
      if (!credentials.name) {
        throw new Error('Name required for team login');
      }

      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('name', credentials.name)
        .maybeSingle();

      if (error) throw error;
      if (!team) {
        throw new Error('Team not found');
      }

      const authUser: AuthUser = {
        role: 'team',
        id: team.id,
        name: team.name
      };
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    }
  };

  const signOut = async () => {
    if (user?.role === 'admin') {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
