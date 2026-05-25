import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const PERIL_COLORS = {
  Hail: 'from-cyan-500 to-blue-500',
  Wind: 'from-teal-500 to-emerald-500',
  Thunderstorm: 'from-yellow-500 to-orange-500',
  'Heavy Rain / Flooding': 'from-blue-500 to-indigo-500',
  'Winter Storm': 'from-slate-400 to-blue-300',
  'Tornado Risk': 'from-red-500 to-rose-600',
  'Ice Storm': 'from-purple-400 to-indigo-400',
};

export default function HomePage({ onNavigate }) {
  const { authFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-storm-400 dark:text-storm-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.email?.split('@')[0]}
        </h1>
        <p className="text-gray-500 dark:text-storm-400 mt-1">
          Here&apos;s your WeatherShield portal overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Searches"
          value={stats?.totalSearches || 0}
          icon="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          color="from-storm-500 to-storm-700"
          onClick={() => onNavigate('history')}
        />
        {stats?.totalUsers != null && (
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            color="from-emerald-500 to-teal-600"
            onClick={() => onNavigate('admin')}
          />
        )}
        <StatCard
          title="Top Perils"
          value={stats?.topPerils?.length || 0}
          subtitle="types detected"
          icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
          color="from-amber-500 to-orange-600"
        />
        <StatCard
          title="States Covered"
          value={stats?.topStates?.length || 0}
          icon="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          color="from-violet-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-storm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Searches
          </h3>
          {stats?.recentSearches?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSearches.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                  onClick={() => onNavigate('history')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {s.city}, {s.state}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-storm-400">
                      DOL: {s.date_of_loss} {s.user_email ? `• ${s.user_email}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-storm-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-storm-500">No searches yet</p>
              <button
                onClick={() => onNavigate('search')}
                className="mt-2 text-sm text-storm-500 hover:text-storm-400 transition"
              >
                Start your first search
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            Top Perils Detected
          </h3>
          {stats?.topPerils?.length > 0 ? (
            <div className="space-y-3">
              {stats.topPerils.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${PERIL_COLORS[p.name] || 'from-gray-400 to-gray-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                      <span className="text-xs text-gray-500 dark:text-storm-400">{p.count} events</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${PERIL_COLORS[p.name] || 'from-gray-400 to-gray-500'}`}
                        style={{ width: `${Math.min(100, (p.count / (stats.topPerils[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-storm-500">No peril data yet</p>
              <p className="text-xs text-gray-400 dark:text-storm-600 mt-1">Search locations to see peril statistics</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            title="New Weather Search"
            desc="Look up weather perils for any US address"
            icon="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            onClick={() => onNavigate('search')}
          />
          <QuickAction
            title="View History"
            desc="Review your past searches and analytics"
            icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            onClick={() => onNavigate('history')}
          />
          <QuickAction
            title="Change Password"
            desc="Update your account security"
            icon="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            onClick={() => onNavigate('password')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10' : ''} transition`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-storm-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-storm-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left w-full"
    >
      <div className="w-9 h-9 rounded-lg bg-storm-600/20 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-storm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-storm-400 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
