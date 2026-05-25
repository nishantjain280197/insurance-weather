import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);
  const [emailSending, setEmailSending] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setForm({ email: '', password: '', role: 'user' });
    setEditingUser(null);
    setShowForm(false);
    setSendEmail(true);
    setError('');
  };

  const sendWelcomeEmail = async (email, password, role) => {
    setEmailSending(true);
    try {
      const portalUrl = window.location.origin;
      const res = await authFetch('/api/users/notify', {
        method: 'POST',
        body: JSON.stringify({ email, password, role, portalUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailPreview(data.email);
      return true;
    } catch (err) {
      console.error('Email notification failed:', err);
      return false;
    } finally {
      setEmailSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        const body = { email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        const res = await authFetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess('User updated successfully');
      } else {
        const res = await authFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (sendEmail) {
          const emailSent = await sendWelcomeEmail(form.email, form.password, form.role);
          setSuccess(
            emailSent
              ? 'User created and welcome email sent successfully'
              : 'User created but email notification failed'
          );
        } else {
          setSuccess('User created successfully');
        }
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResendEmail = async (user) => {
    const sent = await sendWelcomeEmail(user.email, null, user.role);
    if (sent) {
      setSuccess(`Welcome email resent to ${user.email}`);
    } else {
      setError(`Failed to send email to ${user.email}`);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ email: user.email, password: '', role: user.role });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) return;
    try {
      const res = await authFetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-storm-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-storm-400 mt-1">Add, update, or remove portal users</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2.5 bg-gradient-to-r from-storm-600 to-storm-700 hover:from-storm-500 hover:to-storm-600 text-white font-medium rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4.5v15m7.5-7.5h-15'} />
          </svg>
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-storm-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-sm text-storm-300 mb-1">
                  Password {editingUser ? '(leave blank to keep)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingUser}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="block text-sm text-storm-300 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
                >
                  <option value="user" className="bg-gray-800">User</option>
                  <option value="admin" className="bg-gray-800">Admin</option>
                </select>
              </div>
            </div>

            {!editingUser && (
              <div className="flex items-center gap-3 p-3 bg-storm-800/30 rounded-lg border border-white/5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-white/10 peer-focus:ring-2 peer-focus:ring-storm-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-storm-600"></div>
                </label>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-storm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-sm text-storm-300">Send welcome email with login credentials</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={emailSending}
                className="px-6 py-2.5 bg-storm-600 hover:bg-storm-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {emailSending && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {editingUser ? 'Update User' : sendEmail ? 'Create User & Send Email' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-storm-300 font-medium rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {emailPreview && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-storm-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-storm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <h3 className="text-lg font-semibold text-white">Email Preview</h3>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                Simulated
              </span>
            </div>
            <button
              onClick={() => setEmailPreview(null)}
              className="text-storm-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2 text-sm">
              <span className="text-storm-400 font-medium w-16">To:</span>
              <span className="text-white">{emailPreview.to}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-storm-400 font-medium w-16">Subject:</span>
              <span className="text-white">{emailPreview.subject}</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <pre className="text-sm text-storm-200 whitespace-pre-wrap font-sans leading-relaxed">
                {emailPreview.body}
              </pre>
            </div>
          </div>
          <p className="mt-4 text-xs text-storm-500 italic">
            This is a simulated email preview. To enable real email delivery, configure an email service (Nodemailer, Resend, or SendGrid).
          </p>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-medium text-storm-300">Email</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-storm-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-storm-300">Created</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-storm-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 text-white">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-storm-500/20 text-storm-300 border border-storm-500/30'
                      : 'bg-white/10 text-storm-400 border border-white/10'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-storm-400 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleResendEmail(user)}
                      disabled={emailSending}
                      className="px-3 py-1.5 bg-storm-700/30 hover:bg-storm-600/50 text-storm-300 hover:text-white text-sm rounded-lg transition disabled:opacity-50"
                      title="Send welcome email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1.5 bg-storm-700/50 hover:bg-storm-600 text-white text-sm rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
