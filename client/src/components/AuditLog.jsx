import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const ACTION_LABELS = {
  LOGIN: { label: 'Login', color: 'bg-green-500/20 text-green-300' },
  PASSWORD_CHANGE: { label: 'Password Changed', color: 'bg-yellow-500/20 text-yellow-300' },
  WEATHER_SEARCH: { label: 'Weather Search', color: 'bg-blue-500/20 text-blue-300' },
  USER_CREATE: { label: 'User Created', color: 'bg-purple-500/20 text-purple-300' },
  USER_DELETE: { label: 'User Deleted', color: 'bg-red-500/20 text-red-300' },
};

export default function AuditLog() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/audit?limit=${pageSize}&offset=${page * pageSize}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
        <p className="text-gray-500 dark:text-storm-400 mt-1">
          Track all user activity across the portal ({total} events)
        </p>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-storm-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-storm-500">No audit events recorded yet</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-storm-400 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-storm-400 uppercase">User</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-storm-400 uppercase">Action</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-storm-400 uppercase">Details</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-storm-400 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-500/20 text-gray-300' };
                return (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-storm-300 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {log.user_email || 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-storm-400 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 dark:text-storm-500 font-mono">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-storm-400">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm text-gray-600 dark:text-storm-300 bg-gray-100 dark:bg-white/10 rounded hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-sm text-gray-600 dark:text-storm-300 bg-gray-100 dark:bg-white/10 rounded hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
