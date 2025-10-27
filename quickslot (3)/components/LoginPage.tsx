

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { AppLogoIcon } from './icons';

interface LoginPageProps {
  onSwitchToSignUp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Successful login is handled by AuthContext redirecting to the app
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Login failed. Please check your connection and try again.');
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
            Sign in to access your scheduler.
        </p>
        
        {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
                {error}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyles}
              placeholder="sns@gmail.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyles}
              placeholder="••••••••"
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
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignUp} className="font-medium text-primary-600 hover:text-primary-500" disabled={isLoading}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};