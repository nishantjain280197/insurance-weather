import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setError('');
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
        setSuccess('User created successfully');
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
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
        <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm">
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
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-storm-600 hover:bg-storm-500 text-white font-medium rounded-lg transition"
              >
                {editingUser ? 'Update User' : 'Create User'}
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
