import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({ username, email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tg-bg p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-tg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-tg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="tg-card p-8 w-full max-w-md animate-fade-in-up relative">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-tg-accent/20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-tg-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-tg-text mb-2">Create Account</h1>
          <p className="text-tg-muted">Join us and start chatting</p>
        </div>

        {error && (
          <div className="bg-tg-danger/10 border border-tg-danger/20 text-tg-danger p-4 rounded-xl mb-6 text-sm animate-fade-in flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="tg-form-group">
            <label htmlFor="username" className="tg-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="tg-input"
              placeholder="johndoe"
              required
              autoComplete="username"
            />
          </div>

          <div className="tg-form-group">
            <label htmlFor="email" className="tg-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tg-input"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="tg-form-group">
            <label htmlFor="password" className="tg-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tg-input"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-tg-muted mt-1">Must be at least 6 characters</p>
          </div>

          <div className="tg-form-group">
            <label htmlFor="confirmPassword" className="tg-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="tg-input"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tg-btn-primary w-full mt-2"
          >
            {loading ? (
              <>
                <span className="tg-spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-tg-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-tg-accent hover:text-tg-accentHover font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
