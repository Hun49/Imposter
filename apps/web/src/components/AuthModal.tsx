import { useState, type FC, type FormEvent } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const AuthModal: FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInUser, signUpUser } = useGameStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (!username.trim()) {
        setError('Please enter a username.');
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      const res = await signUpUser(username, email, password);
      setIsLoading(false);

      if (!res.success) {
        setError(res.error || 'Account creation failed. Please try again.');
      } else {
        setError(null);
      }
    } else {
      const identifier = username.trim();
      if (!identifier) {
        setError('Please enter your username or email.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setIsLoading(true);
      const res = await signInUser(identifier, password);
      setIsLoading(false);

      if (!res.success) {
        setError(res.error || 'Invalid credentials.');
      } else {
        setError(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[340px] sm:max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-zinc-100">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {isSignUp
              ? 'Join the private party with your username'
              : 'Enter your username/email and password'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Username or Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              {isSignUp ? 'Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                maxLength={48}
                placeholder={isSignUp ? 'e.g. shadow77' : 'Username or email'}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Email (only in sign-up) */}
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-medium"
              />
            </div>
          </div>

          {/* Confirm Password (only in sign-up) */}
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-medium"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-4 text-center text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-3">
          {isSignUp ? 'Already registered?' : 'Need an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-blue-400 hover:underline font-bold cursor-pointer ml-1"
          >
            {isSignUp ? 'Sign In' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
};
