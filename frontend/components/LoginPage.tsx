import React, { useState } from 'react';
import { ShieldCheck, LogIn, User, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';

interface Props {
  onLogin: (username: string, rememberMe: boolean, role: UserRole) => void;
}

// A reusable and more accessible input field component
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: React.ElementType;
}

const InputField = ({ id, label, icon: Icon, ...props }: InputFieldProps) => {
  const labelClass = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider";
  const inputWrapperClass = "relative group";
  const inputClass = "w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm";

  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className={inputWrapperClass}>
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input id={id} className={inputClass} {...props} />
      </div>
    </div>
  );
};

export const LoginPage = ({ onLogin }: Props) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    rememberMe: false,
    role: 'analyst' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    // Simulate an API call for authentication
    setTimeout(() => {
      // In a real app, you would verify credentials against a backend service.
      // For this demo, we'll accept any non-empty username and password.
      onLogin(credentials.username, credentials.rememberMe, credentials.role);
      // No need to call setIsLoading(false) here as the component will unmount on successful login.
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60"
      >
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">SecurePay</span>
          </div>
          <h2 className="text-xl font-bold text-slate-700">Auditor Portal Login</h2>
          <p className="text-sm text-slate-500">Access the Fraud Detection Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            id="username"
            name="username"
            label="Username"
            type="text"
            icon={User}
            value={credentials.username}
            onChange={handleChange}
            placeholder="e.g., alex.carter"
            autoComplete="username"
            required
            disabled={isLoading}
          />
          <InputField
            id="password"
            name="password"
            label="Password"
            type="password"
            icon={KeyRound}
            value={credentials.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isLoading}
          />

          <div>
            <label htmlFor="role" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Access Role
            </label>
            <select
              id="role"
              name="role"
              value={credentials.role}
              onChange={(e) => setCredentials((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              disabled={isLoading}
              className="w-full pl-4 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
            >
              <option value="admin">Administrator</option>
              <option value="analyst">Fraud Analyst</option>
              <option value="viewer">Read-only Viewer</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={credentials.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                Remember me
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 text-center font-medium">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed ${
                isLoading 
                  ? 'bg-slate-400' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
