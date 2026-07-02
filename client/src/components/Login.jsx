import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RAIN_DROPS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 2}s`,
  duration: `${1 + Math.random() * 1}s`,
}));

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-storm-950 to-gray-900 flex items-center justify-center">
      {/* Animated rain */}
      <div className="absolute inset-0 pointer-events-none">
        {RAIN_DROPS.map((drop) => (
          <div
            key={drop.id}
            className="absolute w-0.5 h-8 bg-gradient-to-b from-transparent via-blue-400/30 to-blue-300/50 animate-rain"
            style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
          />
        ))}
      </div>

      {/* Lightning flash */}
      <div className="absolute inset-0 bg-white animate-lightning pointer-events-none" />

      {/* Storm clouds */}
      <div className="absolute top-0 left-0 w-full">
        <div className="flex justify-around opacity-20">
          <svg className="w-64 h-32 text-gray-400 animate-float" style={{ animationDelay: '0s' }} viewBox="0 0 200 80" fill="currentColor">
            <ellipse cx="70" cy="50" rx="60" ry="25" />
            <ellipse cx="120" cy="45" rx="50" ry="20" />
            <ellipse cx="90" cy="35" rx="45" ry="22" />
          </svg>
          <svg className="w-48 h-24 text-gray-500 animate-float" style={{ animationDelay: '1s' }} viewBox="0 0 200 80" fill="currentColor">
            <ellipse cx="70" cy="50" rx="55" ry="22" />
            <ellipse cx="120" cy="48" rx="45" ry="18" />
            <ellipse cx="90" cy="38" rx="40" ry="20" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-storm-500 to-storm-700 shadow-lg shadow-storm-500/30 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WeatherShield</h1>
          <p className="text-storm-300 mt-1">Insurance Weather Intelligence Portal</p>
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-storm-200 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-storm-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-storm-400 focus:outline-none focus:ring-2 focus:ring-storm-500 focus:border-transparent transition"
                  placeholder="admin@weatherportal.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-storm-200 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-storm-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-storm-400 focus:outline-none focus:ring-2 focus:ring-storm-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-storm-600 to-storm-700 hover:from-storm-500 hover:to-storm-600 text-white font-semibold rounded-xl shadow-lg shadow-storm-700/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>


        </div>

        <p className="text-center text-storm-500 text-xs mt-6">
          WeatherShield Insurance Portal &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
