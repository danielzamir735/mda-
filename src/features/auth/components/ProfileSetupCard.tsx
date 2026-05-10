import { useState } from 'react';
import { UserCircle } from 'lucide-react';

interface ProfileSetupCardProps {
  userEmail: string;
  onComplete: (fullName: string) => Promise<void>;
}

export default function ProfileSetupCard({ userEmail, onComplete }: ProfileSetupCardProps) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoading(true);
    await onComplete(fullName.trim());
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-emt-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-emt-gray border-2 border-emt-border rounded-full p-4">
            <UserCircle className="text-emt-muted w-10 h-10" strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-emt-light">השלמת פרופיל</h1>
          <p className="text-emt-muted text-sm text-center">
            מחובר בתור{' '}
            <span className="text-emt-light" dir="ltr">{userEmail}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-emt-gray border border-emt-border rounded-2xl p-6 space-y-5 shadow-md">
          <p className="text-emt-muted text-sm text-center">
            איך לקרוא לך?
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="שם מלא"
              required
              autoFocus
              className="w-full bg-emt-dark border border-emt-border rounded-xl px-4 py-3 text-emt-light placeholder:text-emt-muted text-sm focus:outline-none focus:border-emt-red transition-colors"
            />

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="w-full bg-emt-red text-white font-medium py-3 rounded-xl min-h-12 hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'שומר...' : 'כניסה לאפליקציה'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
