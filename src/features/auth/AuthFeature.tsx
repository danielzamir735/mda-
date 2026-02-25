import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthCard from './components/AuthCard';

export default function AuthFeature() {
  const { session, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users away from the login screen
  useEffect(() => {
    if (!loading && session) {
      navigate('/', { replace: true });
    }
  }, [session, loading, navigate]);

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

  return <AuthCard onGoogleSignIn={signInWithGoogle} isLoading={false} />;
}
