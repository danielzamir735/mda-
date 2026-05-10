import { useState } from 'react';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { AuthError } from '@supabase/supabase-js';

interface AuthCardProps {
  onGoogleSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  onEmailSignUp: (email: string, password: string) => Promise<{ error: AuthError | null; data: { session: unknown } | null }>;
}

export default function AuthCard({ onGoogleSignIn, onEmailSignIn, onEmailSignUp }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await onEmailSignIn(email, password);
      if (error) setError(translateError(error.message));
    } else {
      const { error, data } = await onEmailSignUp(email, password);
      if (error) {
        setError(translateError(error.message));
      } else if (!data?.session) {
        setSuccess('נשלח אליך מייל אימות. אנא בדוק את תיבת הדואר ואשר את כתובת האימייל שלך.');
      }
    }

    setLoading(false);
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen w-full bg-emt-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-emt-red rounded-full p-4 shadow-lg shadow-red-600/30">
            <Heart className="text-white w-8 h-8" strokeWidth={2.5} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-emt-light tracking-wide">חובש פלוס</h1>
          <p className="text-emt-muted text-sm text-center">מערכת ניהול מטופלים לחובשים בשטח</p>
        </div>

        {/* Card */}
        <div className="bg-emt-gray border border-emt-border rounded-2xl p-6 space-y-5 shadow-md">

          {/* Mode tabs */}
          <div className="flex bg-emt-dark rounded-xl p-1">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'signin' ? 'bg-emt-gray text-emt-light shadow-sm' : 'text-emt-muted hover:text-emt-light'}`}
            >
              כניסה
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'signup' ? 'bg-emt-gray text-emt-light shadow-sm' : 'text-emt-muted hover:text-emt-light'}`}
            >
              הרשמה
            </button>
          </div>

          {/* Google */}
          <button
            onClick={onGoogleSignIn}
            aria-label="כניסה עם Google"
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-800 font-medium py-3 px-4 rounded-xl min-h-12 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
          >
            <GoogleIcon />
            <span>המשך עם Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-emt-border" />
            <span className="text-emt-muted text-xs">או עם אימייל</span>
            <div className="flex-1 h-px bg-emt-border" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emt-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="כתובת אימייל"
                required
                dir="ltr"
                className="w-full bg-emt-dark border border-emt-border rounded-xl px-4 py-3 pr-10 text-emt-light placeholder:text-emt-muted text-sm focus:outline-none focus:border-emt-red transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emt-muted pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="סיסמה (לפחות 6 תווים)"
                required
                minLength={6}
                dir="ltr"
                className="w-full bg-emt-dark border border-emt-border rounded-xl px-4 py-3 pr-10 pl-10 text-emt-light placeholder:text-emt-muted text-sm focus:outline-none focus:border-emt-red transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-emt-muted hover:text-emt-light transition-colors"
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-xs text-center bg-green-400/10 rounded-lg px-3 py-2 leading-relaxed">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emt-red text-white font-medium py-3 rounded-xl min-h-12 hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'אנא המתן...' : mode === 'signin' ? 'כניסה' : 'יצירת חשבון'}
            </button>
          </form>
        </div>

        <p className="text-emt-muted text-xs text-center leading-relaxed">
          בכניסה לאפליקציה אתה מסכים לתנאי השימוש ולמדיניות הפרטיות
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'אימייל או סיסמה שגויים';
  if (msg.includes('Email not confirmed')) return 'אנא אשר את כתובת האימייל שלך תחילה';
  if (msg.includes('User already registered')) return 'משתמש עם אימייל זה כבר קיים במערכת';
  if (msg.includes('Password should be at least')) return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  if (msg.includes('rate limit')) return 'יותר מדי ניסיונות. אנא המתן מספר דקות';
  return 'אירעה שגיאה. אנא נסה שוב';
}
