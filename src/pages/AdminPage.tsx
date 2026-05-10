import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, UserCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../features/auth/hooks/useAuth';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }

    const { data: me } = await supabase
      .from('profiles').select('role').eq('id', session.user.id).single();

    if (me?.role !== 'admin') { navigate('/', { replace: true }); return; }

    setCurrentUserId(session.user.id);

    const { data } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false });

    setProfiles(data ?? []);
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: 'user' | 'admin') {
    setUpdatingId(userId);
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: newRole,
    });
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    }
    setUpdatingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-emt-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emt-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentProfile = profiles.find(p => p.id === currentUserId);
  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const today = new Date().toDateString();
  const joinedToday = profiles.filter(p => new Date(p.created_at).toDateString() === today).length;
  const activeToday = profiles.filter(p => new Date(p.last_seen_at).toDateString() === today).length;

  return (
    <div className="min-h-screen bg-emt-dark text-emt-light">
      <div className="max-w-2xl mx-auto px-4 pb-8">

        {/* Header */}
        <div className="flex items-center gap-3 pt-6 pb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-xl hover:bg-emt-gray transition-colors"
            aria-label="חזרה"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">ניהול משתמשים</h1>
            {currentProfile && (
              <p className="text-emt-muted text-xs mt-0.5">
                מחובר בתור {currentProfile.full_name}
              </p>
            )}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-xl hover:bg-emt-gray transition-colors text-emt-muted hover:text-emt-light"
            aria-label="רענן"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-400" />}
            value={profiles.length}
            label="סה״כ"
          />
          <StatCard
            icon={<Shield className="w-5 h-5 text-emt-red" />}
            value={adminCount}
            label="מנהלים"
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5 text-green-400" />}
            value={activeToday}
            label="פעילים היום"
          />
        </div>

        {/* Users list */}
        <div className="bg-emt-gray border border-emt-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-emt-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">כל המשתמשים</h2>
            {joinedToday > 0 && (
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                +{joinedToday} היום
              </span>
            )}
          </div>

          {profiles.length === 0 ? (
            <div className="px-4 py-8 text-center text-emt-muted text-sm">
              אין משתמשים עדיין
            </div>
          ) : (
            <div className="divide-y divide-emt-border">
              {profiles.map(p => (
                <UserRow
                  key={p.id}
                  profile={p}
                  isSelf={p.id === currentUserId}
                  isUpdating={updatingId === p.id}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-emt-gray border border-emt-border rounded-xl p-4 flex flex-col items-center gap-1.5">
      {icon}
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-emt-muted text-xs">{label}</span>
    </div>
  );
}

function UserRow({
  profile, isSelf, isUpdating, onRoleChange,
}: {
  profile: Profile;
  isSelf: boolean;
  isUpdating: boolean;
  onRoleChange: (id: string, role: 'user' | 'admin') => void;
}) {
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : (profile.email?.[0] ?? '?').toUpperCase();

  const joinedDate = new Date(profile.created_at).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'short', year: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="shrink-0">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-emt-red/15 border border-emt-red/30 flex items-center justify-center">
            <span className="text-emt-red text-xs font-bold">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{profile.full_name ?? 'ללא שם'}</p>
          {isSelf && <span className="text-emt-muted text-xs">(אתה)</span>}
        </div>
        <p className="text-emt-muted text-xs truncate" dir="ltr">{profile.email}</p>
      </div>

      {/* Join date — hidden on small screens */}
      <p className="text-emt-muted text-xs shrink-0 hidden sm:block">{joinedDate}</p>

      {/* Role */}
      <div className="shrink-0">
        {isSelf ? (
          <RoleBadge role={profile.role} />
        ) : (
          <select
            value={profile.role}
            disabled={isUpdating}
            onChange={e => onRoleChange(profile.id, e.target.value as 'user' | 'admin')}
            className="bg-emt-dark border border-emt-border rounded-lg text-xs px-2.5 py-1.5 text-emt-light focus:outline-none focus:border-emt-red disabled:opacity-50 transition-colors"
          >
            <option value="user">משתמש</option>
            <option value="admin">מנהל</option>
          </select>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  if (role === 'admin') {
    return (
      <span className="flex items-center gap-1 bg-emt-red/15 text-emt-red text-xs font-medium px-2.5 py-1 rounded-full">
        <Shield className="w-3 h-3" />
        מנהל
      </span>
    );
  }
  return (
    <span className="bg-emt-border/50 text-emt-muted text-xs font-medium px-2.5 py-1 rounded-full">
      משתמש
    </span>
  );
}
