

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { AppLogoIcon } from './icons';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);
    try {
        await signup(email, password);
        // Successful signup is handled by AuthContext redirecting to the app
    } catch (err: any) {
        if (err.response && err.response.data && err.response.data.error) {
            setError(err.response.data.error.message);
        } else {
            setError('Sign up failed. Please try again later.');
        }
    } finally {
        setIsLoading(false);
    }
  };
  
  const inputStyles = "w-full p-3 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition placeholder:text-slate-400 text-slate-900";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex justify-center items-center mb-6">
          <AppLogoIcon className="h-10 w-10 text-primary-500 mr-3" />
          <h1 className="text-3xl font-bold text-slate-900 font-serif">QuickSlot</h1>
        </div>
         <p className="text-center text-slate-500 mb-8">
            Get started with your automated timetable.
        </p>

        {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email-signup" className="block text-sm font-medium text-slate-600 mb-1">
              Email Address
            </label>
            <input
              id="email-signup"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyles}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password-signup" className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              id="password-signup"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyles}
              placeholder="Minimum 6 characters"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-slate-600 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password-signup"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputStyles}
              placeholder="Re-enter your password"
              disabled={isLoading}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-md shadow-sm transition-transform hover:scale-105 disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-primary-600 hover:text-primary-500" disabled={isLoading}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
};