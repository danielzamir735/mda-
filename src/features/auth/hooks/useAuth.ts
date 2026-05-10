import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  last_seen_at: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id);
        supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', newSession.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data ?? null);
    setLoading(false);
  }

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const signInWithEmail = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUpWithEmail = (email: string, password: string) =>
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });

  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>) => {
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();
    if (data) setProfile(data);
  };

  const signOut = () => supabase.auth.signOut();

  return { session, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, updateProfile, signOut };
}
