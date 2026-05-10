import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthCard from './components/AuthCard';
import ProfileSetupCard from './components/ProfileSetupCard';

export default function AuthFeature() {
  const { session, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session && profile?.full_name) {
      navigate('/', { replace: true });
    }
  }, [session, loading, profile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-emt-dark flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-emt-red border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="טוען..."
        />
      </div>
    );
  }

  if (session && !profile?.full_name) {
    return (
      <ProfileSetupCard
        userEmail={session.user.email ?? ''}
        onComplete={async (fullName) => {
          await updateProfile({ full_name: fullName });
          navigate('/', { replace: true });
        }}
      />
    );
  }

  return (
    <AuthCard
      onGoogleSignIn={signInWithGoogle}
      onEmailSignIn={signInWithEmail}
      onEmailSignUp={signUpWithEmail}
    />
  );
}
